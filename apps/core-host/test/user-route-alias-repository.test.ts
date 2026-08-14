import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { JsonUserRouteAliasRepository } from "../src/user-route-alias-repository";

describe("JsonUserRouteAliasRepository", () => {
  it("persists user-confirmed route aliases across repository instances", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "jarvis-route-alias-"));
    try {
      const filePath = path.join(root, "user-route-aliases.json");
      const repository = new JsonUserRouteAliasRepository(filePath);
      await repository.initialize();
      const saved = await repository.upsertAlias({
        id: "route_alias_test",
        label: "IZYtoken admin",
        aliases: ["IZYtoken admin", "IZYtoken 后台"],
        intent: "browser.open",
        targetUrl: "https://example.com/admin",
        targetHostname: "example.com",
        source: "user_confirmed",
        risk: "medium",
        createdAt: "2026-08-13T00:00:00.000Z",
        updatedAt: "2026-08-13T00:00:00.000Z",
      });

      expect(saved).toMatchObject({
        label: "IZYtoken admin",
        targetUrl: "https://example.com/admin",
      });

      const reopened = new JsonUserRouteAliasRepository(filePath);
      await reopened.initialize();
      expect(await reopened.listAliases()).toHaveLength(1);
      expect(await reopened.deleteAlias("route_alias_test")).toBe(true);
      expect(await reopened.listAliases()).toEqual([]);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
