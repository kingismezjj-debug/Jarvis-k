import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SqliteTaskRepository } from "../src/sqlite-task-repository";

describe("SqliteTaskRepository", () => {
  it("migrates, persists task timelines, and recovers running tasks as interrupted", async () => {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "jarvis-k-task-repo-")
    );
    const filePath = path.join(directory, "task-runtime.sqlite");
    const now = "2026-08-11T00:00:00.000Z";
    const repository = new SqliteTaskRepository({ filePath });

    await repository.initialize();
    await repository.createTask({
      id: "task-1",
      title: "Open Notepad",
      state: "running",
      createdAt: now,
      updatedAt: now,
      source: "text",
      intent: "localApp.open",
      routeSource: "intent-router.deterministic.rules"
    });
    await repository.createStep({
      id: "step-1",
      taskId: "task-1",
      title: "Launch known local app: notepad",
      state: "running",
      verificationStatus: "pending",
      toolId: "localApp.open",
      toolInput: {
        target: "notepad"
      }
    });
    await repository.createEvent({
      id: "event-1",
      taskId: "task-1",
      stepId: "step-1",
      type: "step_started",
      message: "Desktop Host launch requested for Notepad.",
      createdAt: now
    });
    await repository.createTask({
      id: "task-2",
      title: "Open VS Code",
      state: "interrupted",
      createdAt: now,
      updatedAt: now,
      source: "voice",
      intent: "localApp.open",
      routeSource: "intent-router.deterministic.rules"
    });
    await repository.createStep({
      id: "step-2",
      taskId: "task-2",
      title: "Launch known local app: vscode",
      state: "running",
      verificationStatus: "pending"
    });
    await repository.close();

    const recovered = new SqliteTaskRepository({ filePath });
    await recovered.initialize();
    await recovered.recoverRunningTasksAsInterrupted(
      "2026-08-11T00:01:00.000Z"
    );
    const tasks = await recovered.listTasks();
    const task = tasks.find((candidate) => candidate.id === "task-1");
    const previouslyInterruptedTask = tasks.find(
      (candidate) => candidate.id === "task-2"
    );

    expect(task).toMatchObject({
      id: "task-1",
      state: "interrupted",
      routeSource: "intent-router.deterministic.rules"
    });
    expect(task?.steps[0]).toMatchObject({
      id: "step-1",
      state: "cancelled",
      verificationStatus: "unverified",
      toolId: "localApp.open",
      toolInput: {
        target: "notepad"
      },
      completedAt: "2026-08-11T00:01:00.000Z",
      failureReason:
        "Step was interrupted during startup recovery; side-effecting work was not replayed."
    });
    expect(previouslyInterruptedTask).toMatchObject({
      id: "task-2",
      state: "interrupted",
      routeSource: "intent-router.deterministic.rules"
    });
    expect(previouslyInterruptedTask?.steps[0]).toMatchObject({
      id: "step-2",
      state: "cancelled",
      verificationStatus: "unverified",
      completedAt: "2026-08-11T00:01:00.000Z",
      failureReason:
        "Step was interrupted during startup recovery; side-effecting work was not replayed."
    });
    expect(task?.events.map((event) => event.type)).toContain("interrupted");
    await recovered.close();
  });
});
