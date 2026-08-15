import { describe, expect, it } from "vitest";
import type { UserPreferenceMemoryRecord } from "@jarvis-k/contracts";
import {
  UserPreferenceMemoryService,
  type UserPreferenceMemoryRepository,
} from "../src/memory/user-preference-memory-service";

class PreferenceRepository implements UserPreferenceMemoryRepository {
  public initialized = 0;
  public failWrites = false;
  public readonly preferences = new Map<string, UserPreferenceMemoryRecord>();

  public async initialize(): Promise<void> {
    this.initialized += 1;
  }

  public async listPreferences(): Promise<UserPreferenceMemoryRecord[]> {
    return Array.from(this.preferences.values());
  }

  public async upsertPreference(
    input: UserPreferenceMemoryRecord,
  ): Promise<UserPreferenceMemoryRecord> {
    if (this.failWrites) {
      throw new Error("repository unavailable");
    }
    this.preferences.set(input.id, { ...input });
    return input;
  }

  public async deletePreference(preferenceId: string): Promise<boolean> {
    return this.preferences.delete(preferenceId);
  }
}

function service(repository?: PreferenceRepository) {
  return new UserPreferenceMemoryService({
    repository,
    now: () => new Date("2026-08-14T00:00:00.000Z"),
  });
}

describe("UserPreferenceMemoryService", () => {
  it("ignores ordinary text without an explicit memory cue", () => {
    expect(service().resolve("please answer in Chinese once")).toBeUndefined();
  });

  it("resolves explicit response-language preferences", () => {
    expect(service().resolve("记住以后用中文回答")).toEqual({
      key: "response_language",
      label: "Response language",
      value: "zh",
      summary: "Prefer Chinese replies",
    });
  });

  it("persists a new provider-neutral preference", async () => {
    const repository = new PreferenceRepository();
    await expect(
      service(repository).recognizeAndPersist("remember reply in Chinese"),
    ).resolves.toMatchObject({
      canPersist: true,
      preference: {
        id: "preference_response_language",
        key: "response_language",
        value: "zh",
        source: "user_confirmed_preference",
        risk: "low",
        enabled: true,
        appliesTo: "ui_projection_only",
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      },
    });
    expect(repository.initialized).toBe(1);
  });

  it("overwrites conflicting values by key while preserving id and createdAt", async () => {
    const repository = new PreferenceRepository();
    repository.preferences.set("preference_response_length", {
      id: "preference_response_length",
      key: "response_length",
      label: "Response length",
      value: "detailed",
      summary: "Prefer detailed replies",
      source: "user_confirmed_preference",
      risk: "low",
      enabled: true,
      appliesTo: "ui_projection_only",
      createdAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z",
    });

    await service(repository).recognizeAndPersist("以后简短回答");

    expect(await repository.listPreferences()).toEqual([
      expect.objectContaining({
        id: "preference_response_length",
        key: "response_length",
        value: "short",
        createdAt: "2026-08-13T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      }),
    ]);
  });

  it("reports recognized preferences as not persisted when storage is absent", async () => {
    await expect(
      service().recognizeAndPersist("remember keep it short"),
    ).resolves.toMatchObject({
      canPersist: false,
      resolvedPreference: {
        key: "response_length",
        value: "short",
      },
    });
  });

  it("lists sanitized user-controlled preference records", async () => {
    const repository = new PreferenceRepository();
    await service(repository).recognizeAndPersist("remember friendly tone");

    await expect(
      service(repository).listUserControlledRecords(),
    ).resolves.toMatchObject({
      persisted: true,
      memories: [
        {
          id: "preference:preference_response_style",
          kind: "preference",
          label: "Response style",
          source: "user_confirmed_preference",
          rawContentExposed: false,
          preferenceKey: "response_style",
          preferenceValue: "friendly",
        },
      ],
    });
  });

  it("deletes preferences through the repository boundary", async () => {
    const repository = new PreferenceRepository();
    await service(repository).recognizeAndPersist("remember concise style");

    await expect(
      service(repository).delete("preference_response_style"),
    ).resolves.toEqual({
      deleted: true,
      persisted: true,
    });
    expect(await repository.listPreferences()).toEqual([]);
  });

  it("does not report write failures as successful persistence", async () => {
    const repository = new PreferenceRepository();
    repository.failWrites = true;

    await expect(
      service(repository).recognizeAndPersist("remember reply in Chinese"),
    ).rejects.toThrow("repository unavailable");
    expect(await repository.listPreferences()).toEqual([]);
  });
});
