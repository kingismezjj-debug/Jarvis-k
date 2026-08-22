import { z } from "zod";

export const PET_SKIN_SCHEMA_VERSION = 1 as const;

export const PET_SKIN_FORMAL_STATES = [
  "idle",
  "listening",
  "thinking",
  "success",
  "error",
  "offline",
] as const;

export type PetSkinFormalState = (typeof PET_SKIN_FORMAL_STATES)[number];

export const BUILTIN_DESKTOP_PET_SKIN_ID = "builtin.jarvis-k.robot" as const;
export const PET_SKIN_V1_MANIFEST_PATH = "manifest.json" as const;
export const PET_SKIN_PREVIEW_PROTOCOL = "jarvis-pet-skin-preview" as const;
export const PET_SKIN_INSTALLED_PROTOCOL = "jarvis-pet-skin" as const;

export const PET_SKIN_V1_POLICY = {
  maxArchiveBytes: 10 * 1024 * 1024,
  maxUnpackedBytes: 25 * 1024 * 1024,
  maxFileBytes: 4 * 1024 * 1024,
  maxFiles: 200,
  maxImageWidth: 1024,
  maxImageHeight: 1024,
  maxImagePixels: 1024 * 1024,
  maxFramesPerSequence: 60,
  maxFrameRate: 24,
  maxDisplayNameLength: 64,
  maxDescriptionLength: 240,
  maxAuthorLength: 80,
  maxLicenseLength: 80,
  maxSkinIdLength: 80,
  maxAssetIdLength: 80,
  allowedImageContentTypes: ["image/png", "image/webp"],
  forbiddenExtensions: [
    ".bat",
    ".cmd",
    ".com",
    ".css",
    ".dll",
    ".exe",
    ".gif",
    ".html",
    ".hta",
    ".js",
    ".jsx",
    ".mjs",
    ".msi",
    ".ps1",
    ".scr",
    ".sh",
    ".svg",
    ".ts",
    ".tsx",
    ".vbs",
    ".wasm",
  ],
} as const;

const SemverSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/);

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

const AssetIdSchema = z
  .string()
  .min(1)
  .max(PET_SKIN_V1_POLICY.maxAssetIdLength)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);

const SkinIdSchema = z
  .string()
  .min(3)
  .max(PET_SKIN_V1_POLICY.maxSkinIdLength)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);

const PreviewIdSchema = z.string().min(8).max(80).regex(/^[A-Za-z0-9_-]+$/);
const ActiveSkinErrorCodeSchema = z.enum([
  "active_skin_unavailable",
  "install_unavailable",
  "install_conflict",
  "install_failed",
  "activation_unavailable",
  "activation_failed",
  "renderer_preflight_failed",
  "remove_unavailable",
  "remove_failed",
  "built_in_fallback",
]);

export const PetSkinAssetSchema = z
  .object({
    path: z.string().min(1).max(160),
    contentType: z.enum(["image/png", "image/webp"]),
    byteLength: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    sha256: Sha256Schema.optional(),
  })
  .strict();

export type PetSkinAsset = z.infer<typeof PetSkinAssetSchema>;

export const PetSkinStateVisualSchema = z
  .object({
    baseAsset: AssetIdSchema,
    stateGlyph: AssetIdSchema.optional(),
    staticVariant: AssetIdSchema.optional(),
    frameSequence: z
      .object({
        frames: z.array(AssetIdSchema).min(1),
        frameRate: z.number().int().min(1),
      })
      .strict()
      .optional(),
  })
  .strict();

export type PetSkinStateVisual = z.infer<typeof PetSkinStateVisualSchema>;

const PetSkinStateMapSchema = z
  .object({
    idle: PetSkinStateVisualSchema,
    listening: PetSkinStateVisualSchema,
    thinking: PetSkinStateVisualSchema,
    success: PetSkinStateVisualSchema,
    error: PetSkinStateVisualSchema,
    offline: PetSkinStateVisualSchema,
  })
  .strict();

export const PetSkinManifestV1Schema = z
  .object({
    schemaVersion: z.literal(PET_SKIN_SCHEMA_VERSION),
    skinId: SkinIdSchema,
    skinVersion: SemverSchema,
    displayName: z.string().min(1).max(PET_SKIN_V1_POLICY.maxDisplayNameLength),
    description: z
      .string()
      .max(PET_SKIN_V1_POLICY.maxDescriptionLength)
      .optional(),
    author: z.string().min(1).max(PET_SKIN_V1_POLICY.maxAuthorLength),
    license: z.string().min(1).max(PET_SKIN_V1_POLICY.maxLicenseLength),
    minimumJarvisVersion: SemverSchema,
    assets: z.record(AssetIdSchema, PetSkinAssetSchema),
    states: PetSkinStateMapSchema,
    reducedMotion: z
      .object({
        states: PetSkinStateMapSchema,
      })
      .strict(),
    packageDigest: Sha256Schema,
  })
  .strict();

export type PetSkinManifestV1 = z.infer<typeof PetSkinManifestV1Schema>;

export type PetSkinValidationReasonCode =
  | "unsupported_schema"
  | "invalid_manifest"
  | "unsupported_asset_type"
  | "missing_state"
  | "missing_reduced_motion_variant"
  | "unsafe_path"
  | "duplicate_path"
  | "resource_limit_exceeded"
  | "invalid_image_metadata"
  | "digest_mismatch"
  | "incompatible_version"
  | "executable_content_detected"
  | "fallback_skin_reserved";

export type PetSkinValidationIssue = {
  code: PetSkinValidationReasonCode;
  field?: string;
  assetId?: string;
  state?: PetSkinFormalState;
  safeDetail?: string;
};

export type PetSkinPackageResource = {
  path: string;
  contentType: "image/png" | "image/webp";
  byteLength: number;
  width: number;
  height: number;
  sha256?: string;
};

export type PetSkinValidationInput = {
  manifest: unknown;
  archiveByteLength?: number;
  unpackedByteLength?: number;
  fileCount?: number;
  computedPackageDigest?: string;
  currentJarvisVersion?: string;
  resources?: PetSkinPackageResource[];
};

export type PetSkinValidationResult =
  | {
      ok: true;
      manifest: PetSkinManifestV1;
      trustState: "validated_preview_package";
      assetCount: number;
    }
  | {
      ok: false;
      trustState: "untrusted_package";
      issues: PetSkinValidationIssue[];
    };

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalizePetSkinManifestForDigest(
  manifest: PetSkinManifestV1,
): string {
  return stableJsonStringify({
    ...manifest,
    packageDigest: "",
  });
}

export function createPetSkinPackageDigestPayload(input: {
  manifest: PetSkinManifestV1;
  resources: PetSkinPackageResource[];
}): string {
  const resourceLines = input.resources
    .map((resource) => ({
      path: resource.path.normalize("NFC"),
      byteLength: resource.byteLength,
      sha256: resource.sha256 ?? "",
    }))
    .sort((left, right) => left.path.localeCompare(right.path, "en"))
    .map(
      (resource) =>
        `${resource.path}\u0000${resource.byteLength}\u0000${resource.sha256}`,
    )
    .join("\n");
  return [
    "jarvis-k-pet-skin-v1",
    canonicalizePetSkinManifestForDigest(input.manifest),
    resourceLines,
  ].join("\n");
}

export const PetSkinPreviewResourceDescriptorSchema = z
  .object({
    assetId: AssetIdSchema,
    state: z.enum(PET_SKIN_FORMAL_STATES).optional(),
    role: z.enum(["base", "stateGlyph", "staticVariant", "frame"]).optional(),
    contentType: z.enum(["image/png", "image/webp"]),
    byteLength: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    resourceUrl: z
      .string()
      .regex(/^jarvis-pet-skin-preview:\/\/[A-Za-z0-9_-]{8,80}\/[a-z0-9][a-z0-9._-]*$/),
  })
  .strict();
export type PetSkinPreviewResourceDescriptor = z.infer<
  typeof PetSkinPreviewResourceDescriptorSchema
>;

export const PetSkinPreviewStateDescriptorSchema = z
  .object({
    baseAssetId: AssetIdSchema,
    stateGlyphAssetId: AssetIdSchema.optional(),
    staticVariantAssetId: AssetIdSchema.optional(),
    frameAssetIds: z.array(AssetIdSchema).optional(),
    frameRate: z.number().int().positive().optional(),
  })
  .strict();
export type PetSkinPreviewStateDescriptor = z.infer<
  typeof PetSkinPreviewStateDescriptorSchema
>;

const PetSkinPreviewStateMapSchema = z
  .object({
    idle: PetSkinPreviewStateDescriptorSchema,
    listening: PetSkinPreviewStateDescriptorSchema,
    thinking: PetSkinPreviewStateDescriptorSchema,
    success: PetSkinPreviewStateDescriptorSchema,
    error: PetSkinPreviewStateDescriptorSchema,
    offline: PetSkinPreviewStateDescriptorSchema,
  })
  .strict();

export const PetSkinPreviewMetadataSchema = z
  .object({
    previewId: PreviewIdSchema,
    skinId: SkinIdSchema,
    skinVersion: SemverSchema,
    displayName: z.string().min(1).max(PET_SKIN_V1_POLICY.maxDisplayNameLength),
    author: z.string().min(1).max(PET_SKIN_V1_POLICY.maxAuthorLength),
    license: z.string().min(1).max(PET_SKIN_V1_POLICY.maxLicenseLength),
    description: z
      .string()
      .max(PET_SKIN_V1_POLICY.maxDescriptionLength)
      .optional(),
    minimumJarvisVersion: SemverSchema,
    packageDigest: Sha256Schema,
    trustState: z.literal("validated_preview_package"),
    assetCount: z.number().int().nonnegative(),
    states: PetSkinPreviewStateMapSchema,
    reducedMotionStates: PetSkinPreviewStateMapSchema,
    resources: z.record(AssetIdSchema, PetSkinPreviewResourceDescriptorSchema),
  })
  .strict();
export type PetSkinPreviewMetadata = z.infer<
  typeof PetSkinPreviewMetadataSchema
>;

export const PetSkinPreviewSelectResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      preview: PetSkinPreviewMetadataSchema,
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      reasonCode: z.enum([
        "unsupported_schema",
        "invalid_manifest",
        "unsupported_asset_type",
        "missing_state",
        "missing_reduced_motion_variant",
        "unsafe_path",
        "duplicate_path",
        "resource_limit_exceeded",
        "invalid_image_metadata",
        "digest_mismatch",
        "incompatible_version",
        "executable_content_detected",
        "fallback_skin_reserved",
        "preview_cancelled",
        "preview_unavailable",
      ]),
      safeMessage: z.string().min(1).max(240),
      metadata: z
        .object({
          entryCount: z.number().int().nonnegative().optional(),
          assetCount: z.number().int().nonnegative().optional(),
          archiveByteLength: z.number().int().nonnegative().optional(),
        })
        .strict()
        .optional(),
    })
    .strict(),
]);
export type PetSkinPreviewSelectResult = z.infer<
  typeof PetSkinPreviewSelectResultSchema
>;

export const PetSkinPreviewResourceRequestSchema = z
  .object({
    previewId: PreviewIdSchema,
    assetId: AssetIdSchema,
  })
  .strict();
export type PetSkinPreviewResourceRequest = z.infer<
  typeof PetSkinPreviewResourceRequestSchema
>;

export const PetSkinPreviewResourceResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      previewId: PreviewIdSchema,
      assetId: AssetIdSchema,
      contentType: z.enum(["image/png", "image/webp"]),
      byteLength: z.number().int().positive(),
      resourceUrl: z
        .string()
        .regex(/^jarvis-pet-skin-preview:\/\/[A-Za-z0-9_-]{8,80}\/[a-z0-9][a-z0-9._-]*$/),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      reasonCode: z.enum(["preview_unavailable", "unsafe_path"]),
      safeMessage: z.string().min(1).max(240),
    })
    .strict(),
]);
export type PetSkinPreviewResourceResult = z.infer<
  typeof PetSkinPreviewResourceResultSchema
>;

export const PetSkinPreviewCancelResultSchema = z
  .object({
    ok: z.boolean(),
    safeMessage: z.string().min(1).max(240).optional(),
  })
  .strict();
export type PetSkinPreviewCancelResult = z.infer<
  typeof PetSkinPreviewCancelResultSchema
>;

export const PetSkinIdentitySchema = z
  .object({
    skinId: SkinIdSchema,
    skinVersion: SemverSchema,
    packageDigest: Sha256Schema,
  })
  .strict();
export type PetSkinIdentity = z.infer<typeof PetSkinIdentitySchema>;

export const PetSkinInstalledResourceDescriptorSchema =
  PetSkinPreviewResourceDescriptorSchema.omit({ resourceUrl: true }).extend({
    resourceUrl: z
      .string()
      .regex(
        /^jarvis-pet-skin:\/\/[a-f0-9]{64}\/[a-z0-9][a-z0-9._-]*$/,
      ),
  });
export type PetSkinInstalledResourceDescriptor = z.infer<
  typeof PetSkinInstalledResourceDescriptorSchema
>;

const PetSkinInstalledResourceMapSchema = z.record(
  AssetIdSchema,
  PetSkinInstalledResourceDescriptorSchema,
);

export const DesktopPetActiveSkinDescriptorSchema = z
  .object({
    identity: PetSkinIdentitySchema,
    displayName: z.string().min(1).max(PET_SKIN_V1_POLICY.maxDisplayNameLength),
    author: z.string().min(1).max(PET_SKIN_V1_POLICY.maxAuthorLength),
    license: z.string().min(1).max(PET_SKIN_V1_POLICY.maxLicenseLength),
    trustState: z.literal("active_skin"),
    states: PetSkinPreviewStateMapSchema,
    reducedMotionStates: PetSkinPreviewStateMapSchema,
    resources: PetSkinInstalledResourceMapSchema,
    sensitiveContentExposed: z.literal(false),
  })
  .strict();
export type DesktopPetActiveSkinDescriptor = z.infer<
  typeof DesktopPetActiveSkinDescriptorSchema
>;

export const PetSkinInstalledRegistryEntrySchema = z
  .object({
    identity: PetSkinIdentitySchema,
    displayName: z.string().min(1).max(PET_SKIN_V1_POLICY.maxDisplayNameLength),
    author: z.string().min(1).max(PET_SKIN_V1_POLICY.maxAuthorLength),
    license: z.string().min(1).max(PET_SKIN_V1_POLICY.maxLicenseLength),
    description: z
      .string()
      .max(PET_SKIN_V1_POLICY.maxDescriptionLength)
      .optional(),
    minimumJarvisVersion: SemverSchema,
    trustState: z.literal("installed_local_skin"),
    installStatus: z.literal("installed"),
    installedAt: z.string().datetime(),
    lastValidatedAt: z.string().datetime(),
    compatibilityStatus: z.enum(["compatible", "incompatible"]),
    assetCount: z.number().int().nonnegative(),
  })
  .strict();
export type PetSkinInstalledRegistryEntry = z.infer<
  typeof PetSkinInstalledRegistryEntrySchema
>;

export const PetSkinRegistryProjectionSchema = z
  .object({
    activeSkin: DesktopPetActiveSkinDescriptorSchema.optional(),
    activeSkinIdentity: PetSkinIdentitySchema.optional(),
    lastKnownGoodSkinIdentity: PetSkinIdentitySchema.optional(),
    builtInFallback: z
      .object({
        skinId: z.literal(BUILTIN_DESKTOP_PET_SKIN_ID),
        trustState: z.literal("built_in_fallback"),
        removable: z.literal(false),
      })
      .strict(),
    installedSkins: z.array(PetSkinInstalledRegistryEntrySchema),
    registryHealthy: z.boolean(),
    safeMessage: z.string().min(1).max(240).optional(),
  })
  .strict();
export type PetSkinRegistryProjection = z.infer<
  typeof PetSkinRegistryProjectionSchema
>;

export const PetSkinInstallFromPreviewRequestSchema = z
  .object({
    previewId: PreviewIdSchema,
  })
  .strict();
export type PetSkinInstallFromPreviewRequest = z.infer<
  typeof PetSkinInstallFromPreviewRequestSchema
>;

export const PetSkinActivateRequestSchema = PetSkinIdentitySchema;
export type PetSkinActivateRequest = PetSkinIdentity;

export const PetSkinRemoveRequestSchema = PetSkinIdentitySchema;
export type PetSkinRemoveRequest = PetSkinIdentity;

export const PetSkinRenderFailureReportSchema = z
  .object({
    packageDigest: Sha256Schema,
    assetId: AssetIdSchema.optional(),
    reasonCode: z.enum([
      "image_load_failed",
      "decode_failed",
      "renderer_timeout",
      "unknown",
    ]),
  })
  .strict();
export type PetSkinRenderFailureReport = z.infer<
  typeof PetSkinRenderFailureReportSchema
>;

export const PetSkinManagementResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      registry: PetSkinRegistryProjectionSchema,
      installedSkin: PetSkinInstalledRegistryEntrySchema.optional(),
      activeSkin: DesktopPetActiveSkinDescriptorSchema.optional(),
      safeMessage: z.string().min(1).max(240).optional(),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      reasonCode: ActiveSkinErrorCodeSchema,
      safeMessage: z.string().min(1).max(240),
      registry: PetSkinRegistryProjectionSchema.optional(),
    })
    .strict(),
]);
export type PetSkinManagementResult = z.infer<
  typeof PetSkinManagementResultSchema
>;

export const PetSkinStudioAssetSourceSchema = z.enum([
  "local_file",
  "generated_asset",
]);
export type PetSkinStudioAssetSource = z.infer<
  typeof PetSkinStudioAssetSourceSchema
>;

export const PetSkinStudioAssetRoleSchema = z.enum([
  "base",
  "stateGlyph",
  "staticVariant",
]);
export type PetSkinStudioAssetRole = z.infer<
  typeof PetSkinStudioAssetRoleSchema
>;

export const PetSkinStudioMetadataUpdateRequestSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1)
      .max(PET_SKIN_V1_POLICY.maxDisplayNameLength),
    description: z
      .string()
      .trim()
      .max(PET_SKIN_V1_POLICY.maxDescriptionLength)
      .optional(),
    author: z
      .string()
      .trim()
      .min(1)
      .max(PET_SKIN_V1_POLICY.maxAuthorLength),
    license: z
      .string()
      .trim()
      .min(1)
      .max(PET_SKIN_V1_POLICY.maxLicenseLength),
    skinVersion: SemverSchema,
  })
  .strict();
export type PetSkinStudioMetadataUpdateRequest = z.infer<
  typeof PetSkinStudioMetadataUpdateRequestSchema
>;

export const PetSkinStudioSelectAssetRequestSchema = z
  .object({
    state: z.enum(PET_SKIN_FORMAL_STATES),
    role: PetSkinStudioAssetRoleSchema,
    source: PetSkinStudioAssetSourceSchema,
  })
  .strict();
export type PetSkinStudioSelectAssetRequest = z.infer<
  typeof PetSkinStudioSelectAssetRequestSchema
>;

export const PetSkinStudioStateDraftSchema = z
  .object({
    baseAssetId: AssetIdSchema.optional(),
    stateGlyphAssetId: AssetIdSchema.optional(),
    staticVariantAssetId: AssetIdSchema.optional(),
    complete: z.boolean(),
    reducedMotionComplete: z.boolean(),
  })
  .strict();
export type PetSkinStudioStateDraft = z.infer<
  typeof PetSkinStudioStateDraftSchema
>;

const PetSkinStudioStateDraftMapSchema = z
  .object({
    idle: PetSkinStudioStateDraftSchema,
    listening: PetSkinStudioStateDraftSchema,
    thinking: PetSkinStudioStateDraftSchema,
    success: PetSkinStudioStateDraftSchema,
    error: PetSkinStudioStateDraftSchema,
    offline: PetSkinStudioStateDraftSchema,
  })
  .strict();

export const PetSkinStudioDraftProjectionSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedSkinId: SkinIdSchema,
    metadata: PetSkinStudioMetadataUpdateRequestSchema,
    states: PetSkinStudioStateDraftMapSchema,
    resources: z.record(AssetIdSchema, PetSkinPreviewResourceDescriptorSchema),
    validationIssues: z.array(z.string().min(1).max(120)).max(20),
    readyForPreview: z.boolean(),
    readyForExport: z.boolean(),
    sourceKinds: z.array(PetSkinStudioAssetSourceSchema).max(2),
  })
  .strict();
export type PetSkinStudioDraftProjection = z.infer<
  typeof PetSkinStudioDraftProjectionSchema
>;

export const PetSkinStudioExportResultSchema = z
  .object({
    exportId: z.string().min(8).max(80).regex(/^[a-f0-9]+$/),
    fileName: z.string().min(1).max(160),
    byteLength: z.number().int().positive(),
    sha256: Sha256Schema,
    packageDigest: Sha256Schema,
    validationStatus: z.literal("PASS"),
  })
  .strict();
export type PetSkinStudioExportResult = z.infer<
  typeof PetSkinStudioExportResultSchema
>;

export const PetSkinStudioResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      draft: PetSkinStudioDraftProjectionSchema,
      preview: PetSkinPreviewMetadataSchema.optional(),
      export: PetSkinStudioExportResultSchema.optional(),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      reasonCode: z.enum([
        "studio_unavailable",
        "unsupported_schema",
        "unsupported_asset_source",
        "unsupported_asset_type",
        "image_cancelled",
        "invalid_image_metadata",
        "resource_limit_exceeded",
        "invalid_manifest",
        "missing_state",
        "missing_reduced_motion_variant",
        "preview_unavailable",
        "duplicate_path",
        "digest_mismatch",
        "incompatible_version",
        "executable_content_detected",
        "fallback_skin_reserved",
        "preview_cancelled",
        "export_cancelled",
        "unsafe_path",
        "write_failed",
      ]),
      safeMessage: z.string().min(1).max(240),
      draft: PetSkinStudioDraftProjectionSchema.optional(),
    })
    .strict(),
]);
export type PetSkinStudioResult = z.infer<typeof PetSkinStudioResultSchema>;

export const PetSkinStudioOpenExportFolderRequestSchema = z
  .object({
    exportId: PetSkinStudioExportResultSchema.shape.exportId,
  })
  .strict();
export type PetSkinStudioOpenExportFolderRequest = z.infer<
  typeof PetSkinStudioOpenExportFolderRequestSchema
>;

const windowsReservedNames = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
]);

function makeIssue(
  code: PetSkinValidationReasonCode,
  detail: Omit<PetSkinValidationIssue, "code"> = {},
): PetSkinValidationIssue {
  return { code, ...detail };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getExtension(pathValue: string): string {
  const lastSegment = pathValue.split("/").at(-1) ?? pathValue;
  const dotIndex = lastSegment.lastIndexOf(".");
  return dotIndex >= 0 ? lastSegment.slice(dotIndex).toLowerCase() : "";
}

function validateSafePackagePath(pathValue: string): PetSkinValidationIssue[] {
  const issues: PetSkinValidationIssue[] = [];
  const lowered = pathValue.toLowerCase();
  if (
    lowered.startsWith("http://") ||
    lowered.startsWith("https://") ||
    lowered.startsWith("data:") ||
    lowered.startsWith("blob:")
  ) {
    issues.push(makeIssue("unsafe_path", { field: "path" }));
  }
  if (
    pathValue.includes("\\") ||
    pathValue.startsWith("/") ||
    /^[A-Za-z]:/.test(pathValue) ||
    pathValue.includes("//")
  ) {
    issues.push(makeIssue("unsafe_path", { field: "path" }));
  }
  const segments = pathValue.split("/");
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        !/^[A-Za-z0-9._-]+$/.test(segment),
    )
  ) {
    issues.push(makeIssue("unsafe_path", { field: "path" }));
  }
  for (const segment of segments) {
    const stem = segment.split(".")[0]?.toLowerCase() ?? "";
    if (windowsReservedNames.has(stem)) {
      issues.push(
        makeIssue("unsafe_path", {
          field: "path",
          safeDetail: "windows_reserved_name",
        }),
      );
      break;
    }
  }
  const extension = getExtension(pathValue);
  if (PET_SKIN_V1_POLICY.forbiddenExtensions.includes(extension as never)) {
    issues.push(
      makeIssue("executable_content_detected", {
        field: "path",
        safeDetail: extension,
      }),
    );
  }
  return issues;
}

function validateAssetMetadata(
  asset: PetSkinAsset | PetSkinPackageResource,
  assetId?: string,
): PetSkinValidationIssue[] {
  const issues: PetSkinValidationIssue[] = [];
  const assetDetail = assetId ? { assetId } : {};
  if (asset.byteLength > PET_SKIN_V1_POLICY.maxFileBytes) {
    issues.push(makeIssue("resource_limit_exceeded", assetDetail));
  }
  if (
    asset.width > PET_SKIN_V1_POLICY.maxImageWidth ||
    asset.height > PET_SKIN_V1_POLICY.maxImageHeight ||
    asset.width * asset.height > PET_SKIN_V1_POLICY.maxImagePixels
  ) {
    issues.push(makeIssue("invalid_image_metadata", assetDetail));
  }
  const expectedExtension =
    asset.contentType === "image/png" ? ".png" : ".webp";
  if (getExtension(asset.path) !== expectedExtension) {
    issues.push(makeIssue("unsupported_asset_type", assetDetail));
  }
  return issues;
}

function compareSemver(left: string, right: string): number {
  const leftParts = left.split("-")[0]?.split(".").map(Number) ?? [];
  const rightParts = right.split("-")[0]?.split(".").map(Number) ?? [];
  for (let index = 0; index < 3; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function collectStateIssues(
  manifest: PetSkinManifestV1,
): PetSkinValidationIssue[] {
  const issues: PetSkinValidationIssue[] = [];
  const assetIds = new Set(Object.keys(manifest.assets));
  const checkVisual = (
    visual: PetSkinStateVisual,
    state: PetSkinFormalState,
    field: "states" | "reducedMotion.states",
  ) => {
    for (const reference of [
      visual.baseAsset,
      visual.stateGlyph,
      visual.staticVariant,
      ...(visual.frameSequence?.frames ?? []),
    ]) {
      if (reference && !assetIds.has(reference)) {
        issues.push(
          makeIssue("invalid_manifest", {
            field,
            state,
            safeDetail: "unknown_asset_reference",
          }),
        );
      }
    }
    if (!visual.stateGlyph && !visual.staticVariant) {
      issues.push(
        makeIssue("missing_reduced_motion_variant", { field, state }),
      );
    }
    if (visual.frameSequence) {
      if (
        visual.frameSequence.frames.length >
          PET_SKIN_V1_POLICY.maxFramesPerSequence ||
        visual.frameSequence.frameRate > PET_SKIN_V1_POLICY.maxFrameRate
      ) {
        issues.push(makeIssue("resource_limit_exceeded", { field, state }));
      }
    }
  };
  for (const state of PET_SKIN_FORMAL_STATES) {
    checkVisual(manifest.states[state], state, "states");
    checkVisual(manifest.reducedMotion.states[state], state, "reducedMotion.states");
  }
  return issues;
}

export function validatePetSkinManifestV1(
  input: PetSkinValidationInput,
): PetSkinValidationResult {
  const issues: PetSkinValidationIssue[] = [];
  if (!isRecord(input.manifest)) {
    return {
      ok: false,
      trustState: "untrusted_package",
      issues: [makeIssue("invalid_manifest")],
    };
  }
  if (input.manifest.schemaVersion !== PET_SKIN_SCHEMA_VERSION) {
    return {
      ok: false,
      trustState: "untrusted_package",
      issues: [makeIssue("unsupported_schema", { field: "schemaVersion" })],
    };
  }
  const parsed = PetSkinManifestV1Schema.safeParse(input.manifest);
  if (!parsed.success) {
    const flattened = parsed.error.issues;
    const missingStateIssue = flattened.find((issue) =>
      issue.path.join(".").startsWith("states."),
    );
    return {
      ok: false,
      trustState: "untrusted_package",
      issues: [
        makeIssue(
          missingStateIssue ? "missing_state" : "invalid_manifest",
          flattened[0]?.path.length
            ? { field: flattened[0].path.join(".") }
            : {},
        ),
      ],
    };
  }
  const manifest = parsed.data;
  if (manifest.skinId === BUILTIN_DESKTOP_PET_SKIN_ID) {
    issues.push(makeIssue("fallback_skin_reserved", { field: "skinId" }));
  }
  if (
    input.archiveByteLength !== undefined &&
    input.archiveByteLength > PET_SKIN_V1_POLICY.maxArchiveBytes
  ) {
    issues.push(makeIssue("resource_limit_exceeded", { field: "archive" }));
  }
  if (
    input.unpackedByteLength !== undefined &&
    input.unpackedByteLength > PET_SKIN_V1_POLICY.maxUnpackedBytes
  ) {
    issues.push(makeIssue("resource_limit_exceeded", { field: "unpacked" }));
  }
  const declaredFileCount = Object.keys(manifest.assets).length + 1;
  if (
    declaredFileCount > PET_SKIN_V1_POLICY.maxFiles ||
    (input.fileCount !== undefined &&
      input.fileCount > PET_SKIN_V1_POLICY.maxFiles)
  ) {
    issues.push(makeIssue("resource_limit_exceeded", { field: "files" }));
  }
  if (
    input.currentJarvisVersion &&
    compareSemver(manifest.minimumJarvisVersion, input.currentJarvisVersion) > 0
  ) {
    issues.push(makeIssue("incompatible_version", { field: "minimumJarvisVersion" }));
  }
  if (
    input.computedPackageDigest &&
    input.computedPackageDigest !== manifest.packageDigest
  ) {
    issues.push(makeIssue("digest_mismatch", { field: "packageDigest" }));
  }
  const normalizedPaths = new Set<string>();
  for (const [assetId, asset] of Object.entries(manifest.assets)) {
    issues.push(
      ...validateSafePackagePath(asset.path).map((issue) => ({
        ...issue,
        assetId,
      })),
    );
    issues.push(...validateAssetMetadata(asset, assetId));
    const normalizedPath = asset.path.toLowerCase();
    if (normalizedPaths.has(normalizedPath)) {
      issues.push(makeIssue("duplicate_path", { assetId }));
    }
    normalizedPaths.add(normalizedPath);
  }
  if (input.resources) {
    for (const resource of input.resources) {
      issues.push(...validateSafePackagePath(resource.path));
      issues.push(...validateAssetMetadata(resource));
      const matchingAsset = Object.values(manifest.assets).find(
        (asset) => asset.path.toLowerCase() === resource.path.toLowerCase(),
      );
      if (!matchingAsset) {
        issues.push(makeIssue("invalid_manifest", { field: "resources" }));
        continue;
      }
      if (
        matchingAsset.contentType !== resource.contentType ||
        matchingAsset.byteLength !== resource.byteLength ||
        matchingAsset.width !== resource.width ||
        matchingAsset.height !== resource.height
      ) {
        issues.push(makeIssue("invalid_image_metadata", { field: "resources" }));
      }
      if (
        matchingAsset.sha256 &&
        resource.sha256 &&
        matchingAsset.sha256 !== resource.sha256
      ) {
        issues.push(makeIssue("digest_mismatch", { field: "resources" }));
      }
    }
  }
  issues.push(...collectStateIssues(manifest));
  if (issues.length > 0) {
    return {
      ok: false,
      trustState: "untrusted_package",
      issues,
    };
  }
  return {
    ok: true,
    trustState: "validated_preview_package",
    manifest,
    assetCount: Object.keys(manifest.assets).length,
  };
}
