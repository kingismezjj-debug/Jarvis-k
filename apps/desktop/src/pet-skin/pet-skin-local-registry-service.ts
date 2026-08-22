import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { protocol as electronProtocol } from "electron";
import {
  BUILTIN_DESKTOP_PET_SKIN_ID,
  PET_SKIN_FORMAL_STATES,
  PET_SKIN_INSTALLED_PROTOCOL,
  PET_SKIN_V1_MANIFEST_PATH,
  PetSkinIdentitySchema,
  PetSkinInstalledRegistryEntrySchema,
  PetSkinManifestV1Schema,
  type DesktopPetActiveSkinDescriptor,
  type PetSkinIdentity,
  type PetSkinInstalledRegistryEntry,
  type PetSkinManifestV1,
  type PetSkinManagementResult,
  type PetSkinRegistryProjection,
  type PetSkinValidationReasonCode,
  createPetSkinPackageDigestPayload,
  validatePetSkinManifestV1,
} from "@jarvis-k/contracts";
import type { PetSkinValidatedPreviewInstallSource } from "./pet-skin-preview-service";

type Protocol = Pick<typeof electronProtocol, "handle" | "unhandle">;

type RegistryFile = {
  schemaVersion: 1;
  activeSkin?: PetSkinIdentity;
  lastKnownGoodSkin?: PetSkinIdentity;
  installedSkins: PetSkinInstalledRegistryEntry[];
};

type InstalledResourceRecord = {
  assetId: string;
  absolutePath: string;
  contentType: "image/png" | "image/webp";
  byteLength: number;
  width: number;
  height: number;
};

const REGISTRY_SCHEMA_VERSION = 1 as const;
const STAGING_PREFIX = ".staging-";

export class PetSkinLocalRegistryService {
  private registry: RegistryFile = {
    schemaVersion: REGISTRY_SCHEMA_VERSION,
    installedSkins: [],
  };
  private protocolRegistered = false;
  private writeQueue: Promise<unknown> = Promise.resolve();
  private registryHealthy = true;
  private lastSafeMessage: string | undefined;

  public constructor(
    private readonly options: {
      rootDirectory: string;
      registryPath: string;
      currentJarvisVersion?: string;
      rendererPreflight?: (
        descriptor: DesktopPetActiveSkinDescriptor,
      ) => Promise<boolean>;
      now?: () => Date;
    },
  ) {
    this.registry = this.loadRegistry();
  }

  public static createInstalledResourceUrl(
    packageDigest: string,
    assetId: string,
  ): string {
    return `${PET_SKIN_INSTALLED_PROTOCOL}://${packageDigest}/${encodeURIComponent(assetId)}`;
  }

  public registerProtocol(protocol: Protocol): void {
    if (this.protocolRegistered) {
      return;
    }
    protocol.handle(PET_SKIN_INSTALLED_PROTOCOL, async (request) => {
      const parsed = new URL(request.url);
      const packageDigest = parsed.hostname;
      const assetId = decodeURIComponent(parsed.pathname.replace(/^\//u, ""));
      const resource = this.readInstalledResource(packageDigest, assetId);
      if (!resource.ok) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(new Uint8Array(resource.bytes), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": resource.contentType,
          "X-Content-Type-Options": "nosniff",
        },
      });
    });
    this.protocolRegistered = true;
  }

  public unregisterProtocol(protocol: Protocol): void {
    if (!this.protocolRegistered) {
      return;
    }
    protocol.unhandle(PET_SKIN_INSTALLED_PROTOCOL);
    this.protocolRegistered = false;
  }

  public getProjection(): PetSkinRegistryProjection {
    const activeSkin = this.resolveActiveSkin();
    return {
      ...(activeSkin ? { activeSkin, activeSkinIdentity: activeSkin.identity } : {}),
      ...(this.registry.lastKnownGoodSkin
        ? { lastKnownGoodSkinIdentity: this.registry.lastKnownGoodSkin }
        : {}),
      builtInFallback: {
        skinId: BUILTIN_DESKTOP_PET_SKIN_ID,
        trustState: "built_in_fallback",
        removable: false,
      },
      installedSkins: this.registry.installedSkins,
      registryHealthy: this.registryHealthy,
      ...(this.lastSafeMessage ? { safeMessage: this.lastSafeMessage } : {}),
    };
  }

  public getActiveSkinDescriptor(): DesktopPetActiveSkinDescriptor | undefined {
    return this.resolveActiveSkin();
  }

  public async installFromPreview(
    source: PetSkinValidatedPreviewInstallSource | null,
  ): Promise<PetSkinManagementResult> {
    return this.enqueueWrite(async () => {
      if (!source) {
        return this.failure(
          "install_unavailable",
          "Validated skin preview is unavailable.",
        );
      }
      await fsp.mkdir(this.options.rootDirectory, { recursive: true });
      const identity = toIdentity(source.manifest);
      const conflict = this.registry.installedSkins.find(
        (entry) =>
          entry.identity.skinId === identity.skinId &&
          entry.identity.skinVersion === identity.skinVersion &&
          entry.identity.packageDigest !== identity.packageDigest,
      );
      if (conflict) {
        return this.failure(
          "install_conflict",
          "A different skin package already uses this skin ID and version.",
        );
      }
      const existing = this.registry.installedSkins.find((entry) =>
        sameIdentity(entry.identity, identity),
      );
      if (existing && this.validateInstalled(identity).ok) {
        return {
          ok: true,
          registry: this.getProjection(),
          installedSkin: existing,
          safeMessage: "Skin is already installed.",
        };
      }

      const finalDirectory = this.installDirectory(identity);
      if (fs.existsSync(finalDirectory)) {
        const validation = this.validateDirectory(source.manifest, finalDirectory);
        if (!validation.ok) {
          return this.failure(
            "install_failed",
            "Existing skin installation is invalid.",
          );
        }
        const entry = createRegistryEntry({
          manifest: source.manifest,
          installedAt: this.nowIso(),
          assetCount: source.resources.size,
        });
        this.registry = {
          ...this.registry,
          installedSkins: [
            ...this.registry.installedSkins.filter(
              (candidate) => !sameIdentity(candidate.identity, identity),
            ),
            entry,
          ].sort(compareEntries),
        };
        await this.persistRegistry();
        return {
          ok: true,
          registry: this.getProjection(),
          installedSkin: entry,
          safeMessage: "Skin is already installed.",
        };
      }

      const stagingDirectory = await fsp.mkdtemp(
        path.join(this.options.rootDirectory, STAGING_PREFIX),
      );
      try {
        await this.copyValidatedPreviewToStaging(source, stagingDirectory);
        const validation = this.validateDirectory(source.manifest, stagingDirectory);
        if (!validation.ok) {
          throw new Error(validation.reasonCode);
        }
        await this.writeInstallMetadata(stagingDirectory, identity);
        await fsp.mkdir(path.dirname(finalDirectory), { recursive: true });
        await fsp.rename(stagingDirectory, finalDirectory);
        const entry = createRegistryEntry({
          manifest: source.manifest,
          installedAt: this.nowIso(),
          assetCount: source.resources.size,
        });
        this.registry = {
          ...this.registry,
          installedSkins: [
            ...this.registry.installedSkins.filter(
              (candidate) => !sameIdentity(candidate.identity, identity),
            ),
            entry,
          ].sort(compareEntries),
        };
        await this.persistRegistry();
        return {
          ok: true,
          registry: this.getProjection(),
          installedSkin: entry,
          safeMessage: "Skin installed locally.",
        };
      } catch {
        await fsp.rm(stagingDirectory, { force: true, recursive: true });
        return this.failure("install_failed", "Skin installation failed.");
      }
    });
  }

  public async activateSkin(
    identity: PetSkinIdentity,
  ): Promise<PetSkinManagementResult> {
    return this.enqueueWrite(async () => {
      const descriptorResult = this.createActiveDescriptor(identity);
      if (!descriptorResult.ok) {
        return this.failure(
          descriptorResult.reasonCode === "incompatible_version"
            ? "activation_unavailable"
            : "activation_failed",
          "Skin cannot be activated.",
        );
      }
      const preflight =
        (await this.options.rendererPreflight?.(descriptorResult.descriptor)) ??
        true;
      if (!preflight) {
        return this.failure(
          "renderer_preflight_failed",
          "Skin renderer preflight failed.",
        );
      }
      const previousActive = this.registry.activeSkin;
      const previousLastKnownGood = this.registry.lastKnownGoodSkin;
      this.registry = {
        ...this.registry,
        activeSkin: identity,
        ...(previousActive && !sameIdentity(previousActive, identity)
          ? { lastKnownGoodSkin: previousActive }
          : previousLastKnownGood
            ? { lastKnownGoodSkin: previousLastKnownGood }
            : {}),
      };
      await this.persistRegistry();
      return {
        ok: true,
        registry: this.getProjection(),
        activeSkin: descriptorResult.descriptor,
        safeMessage: "Skin activated.",
      };
    });
  }

  public async returnToBuiltIn(): Promise<PetSkinManagementResult> {
    return this.enqueueWrite(async () => {
      const { activeSkin: _activeSkin, ...next } = this.registry;
      this.registry = next;
      await this.persistRegistry();
      return {
        ok: true,
        registry: this.getProjection(),
        safeMessage: "Built-in Desktop Pet restored.",
      };
    });
  }

  public async removeSkin(
    identity: PetSkinIdentity,
  ): Promise<PetSkinManagementResult> {
    return this.enqueueWrite(async () => {
      if (identity.skinId === BUILTIN_DESKTOP_PET_SKIN_ID) {
        return this.failure("remove_unavailable", "Built-in skin cannot be removed.");
      }
      const installed = this.registry.installedSkins.some((entry) =>
        sameIdentity(entry.identity, identity),
      );
      if (!installed) {
        return this.failure("remove_unavailable", "Skin is not installed.");
      }
      const fallback =
        this.registry.activeSkin && sameIdentity(this.registry.activeSkin, identity)
          ? this.resolveLastKnownGoodExcluding(identity.packageDigest)
          : undefined;
      const nextRegistry: RegistryFile = {
        schemaVersion: REGISTRY_SCHEMA_VERSION,
        installedSkins: this.registry.installedSkins.filter(
          (entry) => !sameIdentity(entry.identity, identity),
        ),
      };
      if (fallback) {
        nextRegistry.activeSkin = fallback.identity;
        nextRegistry.lastKnownGoodSkin = fallback.identity;
      } else if (
        this.registry.activeSkin &&
        !sameIdentity(this.registry.activeSkin, identity)
      ) {
        nextRegistry.activeSkin = this.registry.activeSkin;
      } else if (
        this.registry.lastKnownGoodSkin &&
        !sameIdentity(this.registry.lastKnownGoodSkin, identity)
      ) {
        nextRegistry.lastKnownGoodSkin = this.registry.lastKnownGoodSkin;
      }
      this.registry = nextRegistry;
      await this.persistRegistry();
      await fsp.rm(this.installDirectory(identity), {
        force: true,
        recursive: true,
      });
      return {
        ok: true,
        registry: this.getProjection(),
        safeMessage: "Skin removed.",
      };
    });
  }

  public async reportRenderFailure(
    packageDigest: string,
  ): Promise<PetSkinManagementResult> {
    return this.enqueueWrite(async () => {
      if (this.registry.activeSkin?.packageDigest !== packageDigest) {
        return {
          ok: true,
          registry: this.getProjection(),
          safeMessage: "Render failure ignored for inactive skin.",
        };
      }
      const fallback = this.resolveLastKnownGoodExcluding(packageDigest);
      this.registry = {
        schemaVersion: REGISTRY_SCHEMA_VERSION,
        installedSkins: this.registry.installedSkins,
        ...(fallback
          ? {
              activeSkin: fallback.identity,
              lastKnownGoodSkin: fallback.identity,
            }
          : {}),
      };
      await this.persistRegistry();
      return {
        ok: true,
        registry: this.getProjection(),
        safeMessage: fallback
          ? "Desktop Pet skin rolled back to last known good."
          : "Desktop Pet skin rolled back to built-in fallback.",
      };
    });
  }

  private async enqueueWrite<T>(work: () => Promise<T>): Promise<T> {
    const next = this.writeQueue.then(work, work);
    this.writeQueue = next.catch(() => undefined);
    return next;
  }

  private loadRegistry(): RegistryFile {
    try {
      const raw = fs.readFileSync(this.options.registryPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<RegistryFile>;
      if (parsed.schemaVersion !== REGISTRY_SCHEMA_VERSION) {
        throw new Error("invalid registry");
      }
      const installedSkins = (parsed.installedSkins ?? []).map((entry) =>
        PetSkinInstalledRegistryEntrySchema.parse(entry),
      );
      const activeSkin = parsed.activeSkin
        ? PetSkinIdentitySchema.parse(parsed.activeSkin)
        : undefined;
      const lastKnownGoodSkin = parsed.lastKnownGoodSkin
        ? PetSkinIdentitySchema.parse(parsed.lastKnownGoodSkin)
        : undefined;
      return {
        schemaVersion: REGISTRY_SCHEMA_VERSION,
        ...(activeSkin ? { activeSkin } : {}),
        ...(lastKnownGoodSkin ? { lastKnownGoodSkin } : {}),
        installedSkins,
      };
    } catch (error) {
      if (fs.existsSync(this.options.registryPath)) {
        this.registryHealthy = false;
        this.lastSafeMessage = "Skin registry was isolated after corruption.";
        try {
          fs.renameSync(
            this.options.registryPath,
            `${this.options.registryPath}.corrupt-${Date.now()}`,
          );
        } catch {
          // Keep fallback behavior even if corruption quarantine fails.
        }
      }
      return {
        schemaVersion: REGISTRY_SCHEMA_VERSION,
        installedSkins: [],
      };
    }
  }

  private async persistRegistry(): Promise<void> {
    await fsp.mkdir(path.dirname(this.options.registryPath), { recursive: true });
    const temporaryPath = `${this.options.registryPath}.tmp-${crypto.randomBytes(6).toString("hex")}`;
    const handle = await fsp.open(temporaryPath, "w");
    try {
      await handle.writeFile(`${JSON.stringify(stripUndefined(this.registry), null, 2)}\n`, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fsp.rename(temporaryPath, this.options.registryPath);
    this.registryHealthy = true;
    this.lastSafeMessage = undefined;
  }

  private async copyValidatedPreviewToStaging(
    source: PetSkinValidatedPreviewInstallSource,
    stagingDirectory: string,
  ): Promise<void> {
    await writeFileAtomic(
      path.join(stagingDirectory, PET_SKIN_V1_MANIFEST_PATH),
      Buffer.from(`${JSON.stringify(source.manifest, null, 2)}\n`, "utf8"),
    );
    for (const resource of source.resources.values()) {
      const bytes = await fsp.readFile(resource.absolutePath);
      if (sha256(bytes) !== resource.sha256 || bytes.length !== resource.byteLength) {
        throw new Error("digest_mismatch");
      }
      await writeFileAtomic(path.join(stagingDirectory, resource.packagePath), bytes);
    }
  }

  private async writeInstallMetadata(
    directory: string,
    identity: PetSkinIdentity,
  ): Promise<void> {
    await writeFileAtomic(
      path.join(directory, "install-metadata.json"),
      Buffer.from(
        `${JSON.stringify(
          {
            schemaVersion: 1,
            identity,
            installedAt: this.nowIso(),
            trustState: "installed_local_skin",
          },
          null,
          2,
        )}\n`,
        "utf8",
      ),
    );
  }

  private validateInstalled(
    identity: PetSkinIdentity,
  ): { ok: true } | { ok: false; reasonCode: PetSkinValidationReasonCode } {
    const manifest = this.readInstalledManifest(identity);
    if (!manifest) {
      return { ok: false, reasonCode: "invalid_manifest" };
    }
    return this.validateDirectory(manifest, this.installDirectory(identity));
  }

  private validateDirectory(
    manifest: PetSkinManifestV1,
    directory: string,
  ): { ok: true } | { ok: false; reasonCode: PetSkinValidationReasonCode } {
    try {
      const resources = Object.values(manifest.assets).map((asset) => {
        const absolutePath = path.join(directory, asset.path);
        const bytes = fs.readFileSync(absolutePath);
        return {
          path: asset.path,
          contentType: asset.contentType,
          byteLength: bytes.length,
          width: asset.width,
          height: asset.height,
          sha256: sha256(bytes),
        };
      });
      const digest = sha256(
        Buffer.from(
          createPetSkinPackageDigestPayload({ manifest, resources }),
          "utf8",
        ),
      );
      const validation = validatePetSkinManifestV1({
        manifest,
        currentJarvisVersion: this.options.currentJarvisVersion ?? "0.1.0",
        computedPackageDigest: digest,
        resources,
        fileCount: resources.length + 1,
        unpackedByteLength: resources.reduce(
          (total, resource) => total + resource.byteLength,
          0,
        ),
      });
      if (!validation.ok) {
        return {
          ok: false,
          reasonCode: validation.issues[0]?.code ?? "invalid_manifest",
        };
      }
    } catch {
      return { ok: false, reasonCode: "invalid_manifest" };
    }
    return { ok: true };
  }

  private resolveActiveSkin(): DesktopPetActiveSkinDescriptor | undefined {
    const active = this.registry.activeSkin;
    if (active) {
      const result = this.createActiveDescriptor(active);
      if (result.ok) {
        return result.descriptor;
      }
    }
    const fallback = this.resolveLastKnownGoodExcluding(
      active?.packageDigest ?? "",
    );
    if (fallback) {
      const result = this.createActiveDescriptor(fallback.identity);
      if (result.ok) {
        return result.descriptor;
      }
    }
    return undefined;
  }

  private resolveLastKnownGoodExcluding(
    packageDigest: string,
  ): PetSkinInstalledRegistryEntry | undefined {
    const candidate = this.registry.lastKnownGoodSkin;
    if (candidate && candidate.packageDigest !== packageDigest) {
      const result = this.createActiveDescriptor(candidate);
      if (result.ok) {
        return this.registry.installedSkins.find((entry) =>
          sameIdentity(entry.identity, candidate),
        );
      }
    }
    return undefined;
  }

  private createActiveDescriptor(
    identity: PetSkinIdentity,
  ):
    | { ok: true; descriptor: DesktopPetActiveSkinDescriptor }
    | { ok: false; reasonCode: PetSkinValidationReasonCode } {
    const entry = this.registry.installedSkins.find((candidate) =>
      sameIdentity(candidate.identity, identity),
    );
    if (!entry) {
      return { ok: false, reasonCode: "invalid_manifest" };
    }
    const manifest = this.readInstalledManifest(identity);
    if (!manifest) {
      return { ok: false, reasonCode: "invalid_manifest" };
    }
    const validation = this.validateDirectory(manifest, this.installDirectory(identity));
    if (!validation.ok) {
      return validation;
    }
    const resources = new Map<string, InstalledResourceRecord>();
    for (const [assetId, asset] of Object.entries(manifest.assets)) {
      resources.set(assetId, {
        assetId,
        absolutePath: path.join(this.installDirectory(identity), asset.path),
        contentType: asset.contentType,
        byteLength: asset.byteLength,
        width: asset.width,
        height: asset.height,
      });
    }
    const stateDescriptor = (states: typeof manifest.states) =>
      Object.fromEntries(
        PET_SKIN_FORMAL_STATES.map((state) => {
          const visual = states[state];
          return [
            state,
            {
              baseAssetId: visual.baseAsset,
              ...(visual.stateGlyph ? { stateGlyphAssetId: visual.stateGlyph } : {}),
              ...(visual.staticVariant
                ? { staticVariantAssetId: visual.staticVariant }
                : {}),
              ...(visual.frameSequence
                ? {
                    frameAssetIds: visual.frameSequence.frames,
                    frameRate: visual.frameSequence.frameRate,
                  }
                : {}),
            },
          ];
        }),
      ) as DesktopPetActiveSkinDescriptor["states"];
    return {
      ok: true,
      descriptor: {
        identity,
        displayName: entry.displayName,
        author: entry.author,
        license: entry.license,
        trustState: "active_skin",
        states: stateDescriptor(manifest.states),
        reducedMotionStates: stateDescriptor(manifest.reducedMotion.states),
        resources: Object.fromEntries(
          Array.from(resources.entries()).map(([assetId, resource]) => [
            assetId,
            {
              assetId,
              contentType: resource.contentType,
              byteLength: resource.byteLength,
              width: resource.width,
              height: resource.height,
              resourceUrl: PetSkinLocalRegistryService.createInstalledResourceUrl(
                identity.packageDigest,
                assetId,
              ),
            },
          ]),
        ),
        sensitiveContentExposed: false,
      },
    };
  }

  private readInstalledManifest(identity: PetSkinIdentity): PetSkinManifestV1 | null {
    try {
      return PetSkinManifestV1Schema.parse(JSON.parse(
        fs.readFileSync(
          path.join(this.installDirectory(identity), PET_SKIN_V1_MANIFEST_PATH),
          "utf8",
        ),
      ));
    } catch {
      return null;
    }
  }

  private readInstalledResource(
    packageDigest: string,
    assetId: string,
  ):
    | {
        ok: true;
        bytes: Buffer;
        contentType: "image/png" | "image/webp";
      }
    | { ok: false } {
    if (!/^[a-f0-9]{64}$/u.test(packageDigest) || !/^[a-z0-9][a-z0-9._-]*$/u.test(assetId)) {
      return { ok: false };
    }
    const descriptor = this.resolveActiveSkin();
    if (!descriptor || descriptor.identity.packageDigest !== packageDigest) {
      return { ok: false };
    }
    const manifest = this.readInstalledManifest(descriptor.identity);
    const asset = manifest?.assets[assetId];
    if (!asset) {
      return { ok: false };
    }
    try {
      const absolutePath = path.join(this.installDirectory(descriptor.identity), asset.path);
      const bytes = fs.readFileSync(absolutePath);
      if (sha256(bytes) !== asset.sha256) {
        return { ok: false };
      }
      return { ok: true, bytes, contentType: asset.contentType };
    } catch {
      return { ok: false };
    }
  }

  private installDirectory(identity: PetSkinIdentity): string {
    return path.join(
      this.options.rootDirectory,
      identity.skinId,
      identity.skinVersion,
      identity.packageDigest,
    );
  }

  private nowIso(): string {
    return (this.options.now?.() ?? new Date()).toISOString();
  }

  private failure(
    reasonCode: Extract<PetSkinManagementResult, { ok: false }>["reasonCode"],
    safeMessage: string,
  ): PetSkinManagementResult {
    return {
      ok: false,
      reasonCode,
      safeMessage,
      registry: this.getProjection(),
    };
  }
}

async function writeFileAtomic(filePath: string, bytes: Buffer): Promise<void> {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${crypto.randomBytes(6).toString("hex")}`;
  const handle = await fsp.open(temporaryPath, "w");
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fsp.rename(temporaryPath, filePath);
}

function createRegistryEntry(input: {
  manifest: PetSkinValidatedPreviewInstallSource["manifest"];
  installedAt: string;
  assetCount: number;
}): PetSkinInstalledRegistryEntry {
  return {
    identity: toIdentity(input.manifest),
    displayName: input.manifest.displayName,
    author: input.manifest.author,
    license: input.manifest.license,
    ...(input.manifest.description
      ? { description: input.manifest.description }
      : {}),
    minimumJarvisVersion: input.manifest.minimumJarvisVersion,
    trustState: "installed_local_skin",
    installStatus: "installed",
    installedAt: input.installedAt,
    lastValidatedAt: input.installedAt,
    compatibilityStatus: "compatible",
    assetCount: input.assetCount,
  };
}

function toIdentity(manifest: PetSkinValidatedPreviewInstallSource["manifest"]): PetSkinIdentity {
  return {
    skinId: manifest.skinId,
    skinVersion: manifest.skinVersion,
    packageDigest: manifest.packageDigest,
  };
}

function sameIdentity(
  left?: PetSkinIdentity,
  right?: PetSkinIdentity,
): boolean {
  return (
    left?.skinId === right?.skinId &&
    left?.skinVersion === right?.skinVersion &&
    left?.packageDigest === right?.packageDigest
  );
}

function compareEntries(
  left: PetSkinInstalledRegistryEntry,
  right: PetSkinInstalledRegistryEntry,
): number {
  return `${left.identity.skinId}/${left.identity.skinVersion}/${left.identity.packageDigest}`.localeCompare(
    `${right.identity.skinId}/${right.identity.skinVersion}/${right.identity.packageDigest}`,
    "en",
  );
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    );
  }
  return value;
}

function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
