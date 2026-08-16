import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, it } from "vitest";
import type { VoiceRegressionRecord } from "@jarvis-k/contracts";

import { JsonVoiceRegressionRepository } from "../src/voice-regression-repository";

describe("JsonVoiceRegressionRepository", () => {
  it("defaults off and persists only local text regression records", async () => {
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-voice-regression-"),
    );
    try {
      const filePath = path.join(tempDir, "records.json");
      const repository = new JsonVoiceRegressionRepository(filePath);

      await repository.initialize();
      expect(await repository.getConsentLevel()).toBe("off");
      expect(await repository.countRecords()).toBe(0);

      await repository.setConsentLevel("local_text");
      const appended = await repository.appendRecord(createRecord("one"));

      expect(appended.privacy).toEqual({
        redactions: [],
        containsAudio: false,
        uploadAllowed: false,
      });
      expect(await repository.countRecords()).toBe(1);
      expect(await repository.listRecords({ limit: 5 })).toHaveLength(1);

      const raw = await readFile(filePath, "utf8");
      expect(raw).toContain('"consentLevel": "local_text"');
      expect(raw).toContain('"containsAudio": false');
      expect(raw).toContain('"uploadAllowed": false');
      expect(raw).not.toContain("credential");

      const updated = await repository.updateFeedback({
        recordId: appended.id,
        feedback: {
          status: "corrected",
          correctedText: "打开 VS Code",
          intendedIntent: "localApp.open",
        },
      });
      expect(updated?.feedback).toMatchObject({
        status: "corrected",
        correctedText: "打开 VS Code",
      });

      expect(await repository.deleteRecord(appended.id)).toBe(true);
      expect(await repository.countRecords()).toBe(0);

      await repository.appendRecord(createRecord("two"));
      await repository.appendRecord(createRecord("three"));
      expect(await repository.clearRecords()).toBe(2);
      expect(await repository.listRecords()).toEqual([]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("quarantines corrupt state instead of silently overwriting it", async () => {
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-voice-regression-"),
    );
    try {
      const filePath = path.join(tempDir, "records.json");
      await writeFile(filePath, "{ not json", "utf8");
      const repository = new JsonVoiceRegressionRepository(filePath);

      await repository.initialize();

      expect(await repository.getConsentLevel()).toBe("off");
      const files = await readdir(tempDir);
      expect(files.some((file) => file.startsWith("records.json.corrupt-"))).toBe(
        true,
      );
      expect(await readFile(filePath, "utf8")).toContain('"records": []');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("serializes concurrent record appends without losing records", async () => {
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), "jarvis-voice-regression-"),
    );
    try {
      const filePath = path.join(tempDir, "records.json");
      const repository = new JsonVoiceRegressionRepository(filePath);
      await repository.initialize();

      await Promise.all(
        Array.from({ length: 12 }, (_, index) =>
          repository.appendRecord(createRecord(`batch-${index}`)),
        ),
      );

      expect(await repository.countRecords()).toBe(12);
      const raw = await readFile(filePath, "utf8");
      expect(raw).not.toContain(".tmp-");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

function createRecord(suffix: string): VoiceRegressionRecord {
  return {
    id: `voice-regression_${suffix}`,
    schemaVersion: 1,
    createdAt: "2026-08-16T00:00:00.000Z",
    consentLevel: "local_text",
    locale: "zh-CN",
    mode: "command",
    asr: {
      providerId: "fixture-asr",
      rawTranscript: `打开记事本 ${suffix}`,
      isFinal: true,
    },
    resolver: {
      version: "voice-command-resolver.deterministic.v1",
      normalizedText: "打开记事本",
      outcomeClass: "candidate",
      candidates: [
        {
          intent: "localApp.open",
          safeSlots: { target: "notepad" },
          confidence: 0.95,
          source: "structured_candidate_selector",
        },
      ],
      clarificationRequired: false,
      blocked: false,
      latencyMs: 1,
    },
    feedback: {
      status: "accepted",
      selectedCandidateIndex: 0,
    },
    context: {
      activeView: "voice",
    },
    privacy: {
      redactions: [],
      containsAudio: false,
      uploadAllowed: false,
    },
  };
}
