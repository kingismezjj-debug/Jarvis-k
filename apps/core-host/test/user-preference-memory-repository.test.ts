import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import { JsonUserPreferenceMemoryRepository } from "../src/user-preference-memory-repository";

describe("JsonUserPreferenceMemoryRepository", () => {
  it("persists user-controlled preferences across repository instances", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "jarvis-preference-"));
    try {
      const filePath = path.join(root, "user-preference-memories.json");
      const repository = new JsonUserPreferenceMemoryRepository(filePath);
      await repository.initialize();
      const saved = await repository.upsertPreference({
        id: "preference_response_language",
        key: "response_language",
        label: "Response language",
        value: "zh",
        summary: "Prefer Chinese replies",
        source: "user_confirmed_preference",
        risk: "low",
        enabled: true,
        appliesTo: "ui_projection_only",
        createdAt: "2026-08-13T00:00:00.000Z",
        updatedAt: "2026-08-13T00:00:00.000Z",
      });

      expect(saved).toMatchObject({
        key: "response_language",
        value: "zh",
        appliesTo: "ui_projection_only",
      });
      await repository.upsertPreference({
        id: "preference_response_style",
        key: "response_style",
        label: "Response style",
        value: "friendly",
        summary: "Prefer friendly tone",
        source: "user_confirmed_preference",
        risk: "low",
        enabled: true,
        appliesTo: "ui_projection_only",
        createdAt: "2026-08-13T00:00:01.000Z",
        updatedAt: "2026-08-13T00:00:01.000Z",
      });

      const reopened = new JsonUserPreferenceMemoryRepository(filePath);
      await reopened.initialize();
      expect(await reopened.listPreferences()).toHaveLength(2);
      expect(await reopened.listPreferences()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "response_style",
            value: "friendly",
          }),
        ]),
      );
      expect(
        await reopened.deletePreference("preference_response_language"),
      ).toBe(true);
      expect(await reopened.deletePreference("preference_response_style")).toBe(
        true,
      );
      expect(await reopened.listPreferences()).toEqual([]);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
