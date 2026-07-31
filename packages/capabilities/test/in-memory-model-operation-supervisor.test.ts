import { describe, expect, it } from "vitest";
import { InMemoryModelOperationSupervisor } from "../src";

describe("InMemoryModelOperationSupervisor", () => {
  it("tracks model operation state transitions", async () => {
    let tick = 0;
    const supervisor = new InMemoryModelOperationSupervisor(
      () => new Date(Date.UTC(2026, 6, 31, 0, 0, tick++))
    );

    const started = await supervisor.start({
      operationId: "model-op-test",
      modelId: "vendor/local-stt-small",
      capability: "speech_to_text"
    });
    const downloading = await supervisor.update({
      operationId: started.operationId,
      phase: "downloading",
      progress: {
        downloadedBytes: 128,
        totalBytes: 512
      }
    });
    const available = await supervisor.update({
      operationId: started.operationId,
      phase: "available"
    });

    expect(started.phase).toBe("queued");
    expect(downloading.progress?.downloadedBytes).toBe(128);
    expect(available.phase).toBe("available");
    expect(available.updatedAt > started.updatedAt).toBe(true);
  });

  it("lists active operations and returns defensive copies", async () => {
    const supervisor = new InMemoryModelOperationSupervisor(
      () => new Date("2026-07-31T00:00:00.000Z")
    );

    const active = await supervisor.start({
      operationId: "model-op-active",
      modelId: "vendor/local-stt-small",
      capability: "speech_to_text"
    });
    const completed = await supervisor.start({
      operationId: "model-op-complete",
      modelId: "vendor/local-ocr-small",
      capability: "ocr"
    });
    await supervisor.update({
      operationId: completed.operationId,
      phase: "available"
    });

    const listed = await supervisor.list({ activeOnly: true });
    listed[0]?.reasons.push("mutated outside");

    expect(listed.map((operation) => operation.operationId)).toEqual([
      active.operationId
    ]);
    expect((await supervisor.get(active.operationId))?.reasons).toEqual([]);
  });

  it("cancels operations with a standard snapshot", async () => {
    const supervisor = new InMemoryModelOperationSupervisor(
      () => new Date("2026-07-31T00:00:00.000Z")
    );
    const started = await supervisor.start({
      operationId: "model-op-cancel",
      modelId: "vendor/local-stt-small",
      capability: "speech_to_text"
    });

    const cancelled = await supervisor.cancel(
      started.operationId,
      "User cancelled install."
    );

    expect(cancelled).toMatchObject({
      operationId: started.operationId,
      phase: "cancelled",
      reasons: ["User cancelled install."]
    });
    expect(await supervisor.list({ activeOnly: true })).toEqual([]);
  });
});
