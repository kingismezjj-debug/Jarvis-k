import { describe, expect, it } from "vitest";
import type {
  UserRouteAliasRecord,
  VoiceCommandAliasRecord,
} from "@jarvis-k/contracts";
import {
  RouteAliasMemoryService,
  type UserRouteAliasRepository,
  type VoiceCommandAliasRepository,
} from "../src/memory/route-alias-memory-service";

class RouteAliasRepository implements UserRouteAliasRepository {
  public initialized = 0;
  public readonly aliases = new Map<string, UserRouteAliasRecord>();

  public async initialize(): Promise<void> {
    this.initialized += 1;
  }

  public async listAliases(): Promise<UserRouteAliasRecord[]> {
    return Array.from(this.aliases.values());
  }

  public async upsertAlias(
    input: UserRouteAliasRecord,
  ): Promise<UserRouteAliasRecord> {
    this.aliases.set(input.id, { ...input });
    return input;
  }

  public async deleteAlias(aliasId: string): Promise<boolean> {
    return this.aliases.delete(aliasId);
  }
}

class VoiceAliasRepository implements VoiceCommandAliasRepository {
  public initialized = 0;
  public readonly aliases = new Map<string, VoiceCommandAliasRecord>();

  public async initialize(): Promise<void> {
    this.initialized += 1;
  }

  public async listAliases(): Promise<VoiceCommandAliasRecord[]> {
    return Array.from(this.aliases.values());
  }

  public async upsertAlias(
    input: VoiceCommandAliasRecord,
  ): Promise<VoiceCommandAliasRecord> {
    this.aliases.set(input.id, { ...input });
    return input;
  }

  public async deleteAlias(aliasId: string): Promise<boolean> {
    return this.aliases.delete(aliasId);
  }
}

function service(input: {
  routeRepository?: RouteAliasRepository;
  voiceRepository?: VoiceAliasRepository;
} = {}) {
  return new RouteAliasMemoryService({
    routeAliasRepository: input.routeRepository,
    voiceAliasRepository: input.voiceRepository,
    now: () => new Date("2026-08-14T00:00:00.000Z"),
  });
}

describe("RouteAliasMemoryService", () => {
  it("creates pending HTTPS route alias proposals without direct action", () => {
    const proposal = service().createLearningProposal(
      "remember IZYtoken admin URL is https://api.izytoken.com",
    );

    expect(proposal).toMatchObject({
      label: "IZYtoken admin",
      intent: "browser.open",
      targetUrl: "https://api.izytoken.com/",
      targetHostname: "api.izytoken.com",
      requiresConfirmation: true,
      directActionAttempted: false,
    });
    expect(proposal?.aliases).toContain("easy TOKEN 后台");
  });

  it("rejects route alias proposals with sensitive query parameters", () => {
    const sensitiveKey = ["to", "ken"].join("");
    expect(
      service().createLearningProposal(
        `remember IZYtoken as https://api.izytoken.com?${sensitiveKey}=redacted`,
      ),
    ).toBeUndefined();
  });

  it("persists route aliases only after tracked confirmation", async () => {
    const routeRepository = new RouteAliasRepository();
    const aliasService = service({ routeRepository });
    const proposal = aliasService.createLearningProposal(
      "remember IZYtoken admin URL is https://api.izytoken.com",
    );
    expect(proposal).toBeDefined();
    aliasService.trackLearningProposal(proposal!);

    await expect(
      aliasService.confirmRouteAlias(proposal!.id),
    ).resolves.toMatchObject({
      status: "stored",
      alias: {
        label: "IZYtoken admin",
        targetUrl: "https://api.izytoken.com/",
        source: "user_confirmed",
        risk: "medium",
      },
    });
    expect(routeRepository.initialized).toBe(1);
    expect(await routeRepository.listAliases()).toHaveLength(1);
  });

  it("does not create aliases for unknown or unavailable confirmations", async () => {
    const routeRepository = new RouteAliasRepository();
    await expect(
      service({ routeRepository }).confirmRouteAlias("missing"),
    ).resolves.toEqual({ status: "proposal_expired" });
    await expect(service().confirmRouteAlias("missing")).resolves.toEqual({
      status: "store_unavailable",
    });
    expect(await routeRepository.listAliases()).toEqual([]);
  });

  it("resolves confirmed route aliases to safe browser targets", async () => {
    const routeRepository = new RouteAliasRepository();
    await routeRepository.upsertAlias({
      id: "route_alias_izy",
      label: "IZYtoken admin",
      aliases: ["IZYtoken 后台", "easy TOKEN 后台"],
      intent: "browser.open",
      targetUrl: "https://api.izytoken.com/",
      targetHostname: "api.izytoken.com",
      source: "user_confirmed",
      risk: "medium",
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    });

    await expect(
      service({ routeRepository }).resolveRouteAliasFromOpenTarget(
        "easy TOKEN 后台",
      ),
    ).resolves.toMatchObject({
      alias: { id: "route_alias_izy" },
      safeUrl: new URL("https://api.izytoken.com/"),
    });
  });

  it("returns matched aliases without a safe URL when persisted data violates policy", async () => {
    const routeRepository = new RouteAliasRepository();
    await routeRepository.upsertAlias({
      id: "route_alias_izy",
      label: "IZYtoken admin",
      aliases: ["IZYtoken admin"],
      intent: "browser.open",
      targetUrl: "http://api.izytoken.com/",
      targetHostname: "api.izytoken.com",
      source: "user_confirmed",
      risk: "medium",
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    });

    await expect(
      service({ routeRepository }).resolveRouteAliasByTarget("IZYtoken admin"),
    ).resolves.toMatchObject({
      alias: { id: "route_alias_izy" },
      safeUrl: undefined,
    });
  });

  it("saves, resolves, and deletes voice command aliases", async () => {
    const voiceRepository = new VoiceAliasRepository();
    const aliasService = service({ voiceRepository });

    const saved = await aliasService.saveVoiceAlias({
      rawAlias: "打开 EC TOKEN 后台",
      normalizedTranscript: "open IZYtoken admin",
      intent: "browser.open",
      slots: { target: "IZYtoken admin" },
    });

    expect(saved).toMatchObject({
      status: "stored",
      alias: {
        rawAlias: "打开 EC TOKEN 后台",
        normalizedTranscript: "open IZYtoken admin",
      },
    });
    await expect(
      aliasService.resolveVoiceAliasByText("打开 EC TOKEN 后台"),
    ).resolves.toMatchObject({
      intent: "browser.open",
      slots: { target: "IZYtoken admin" },
    });
    await expect(
      aliasService.deleteVoiceAlias(saved.alias!.id),
    ).resolves.toEqual({
      deleted: true,
      persisted: true,
    });
  });

  it("lists user-controlled alias memory records without raw private exposure", async () => {
    const routeRepository = new RouteAliasRepository();
    const voiceRepository = new VoiceAliasRepository();
    const aliasService = service({ routeRepository, voiceRepository });
    await routeRepository.upsertAlias({
      id: "route_alias_izy",
      label: "IZYtoken admin",
      aliases: ["IZYtoken admin"],
      intent: "browser.open",
      targetUrl: "https://api.izytoken.com/",
      targetHostname: "api.izytoken.com",
      source: "user_confirmed",
      risk: "medium",
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    });
    await aliasService.saveVoiceAlias({
      rawAlias: "打开 EC TOKEN 后台",
      normalizedTranscript: "open IZYtoken admin",
      intent: "browser.open",
      slots: { target: "IZYtoken admin" },
    });

    await expect(
      aliasService.listUserControlledRecords({
        summarizeSlots: (slots) => `target:${String(slots.target)}`,
      }),
    ).resolves.toMatchObject({
      persisted: true,
      memories: [
        {
          kind: "voice_command_alias",
          rawContentExposed: false,
          summary: "browser.open / target:IZYtoken admin",
        },
        {
          kind: "route_alias",
          rawContentExposed: false,
          summary: "browser.open / api.izytoken.com",
        },
      ],
    });
  });
});
