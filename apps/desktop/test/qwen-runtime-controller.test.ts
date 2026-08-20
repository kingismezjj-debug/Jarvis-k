import { describe, expect, it, vi } from "vitest";
import {
  IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
  IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import {
  createQwenRuntimeConfig,
  QWEN_RETAINED_SESSION_ID,
  qwenConversationSurfaceRouteLimit,
} from "../src/qwen-runtime/qwen-runtime-config";
import { QwenRuntimeController } from "../src/qwen-runtime/qwen-runtime-controller";
import { registerQwenRuntimeIpc } from "../src/ipc/register-qwen-runtime-ipc";

class FakeIpcMain {
  public readonly handlers = new Map<string, (...args: unknown[]) => unknown>();

  public handle(channel: string, handler: (...args: unknown[]) => unknown): void {
    this.handlers.set(channel, handler);
  }

  public removeHandler(channel: string): void {
    this.handlers.delete(channel);
  }

  public async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler(...args);
  }
}

function retainedMarker(): string {
  return JSON.stringify({
    sessionId: QWEN_RETAINED_SESSION_ID,
    status: "retained_bounded_developer_alpha_session",
    dependencyEnv: "retained",
    artifactCache: "retained",
    helperLifecycle: "shutdown_after_verification",
    approvedArtifactCount: 7,
    digestBeforeLoad: "passed",
    defaultOn: false,
    releaseExposure: false,
  });
}

function createController(options: {
  markerAvailable?: boolean;
  stopHelper?: () => Promise<boolean>;
} = {}): QwenRuntimeController {
  const config = createQwenRuntimeConfig({
    baseDirectory: "C:/repo/apps/desktop/dist",
    env: {},
  });
  return new QwenRuntimeController({
    config,
    exists: () => options.markerAvailable ?? false,
    readText: () => retainedMarker(),
    ...(options.stopHelper ? { stopHelper: options.stopHelper } : {}),
  });
}

describe("QwenRuntimeController", () => {
  it("uses an injected storage profile marker path for packaged Alpha", () => {
    const markerPath =
      "C:\\Users\\tester\\AppData\\Local\\Jarvis-K-Alpha\\models\\qwen-retained-product-session-2026-08-10\\session-marker.sanitized.json";
    const config = createQwenRuntimeConfig({
      baseDirectory: "C:/repo/apps/desktop/dist",
      env: {
        JARVIS_K_QWEN_RETAINED_SESSION_MARKER_PATH: markerPath,
      },
    });

    expect(config.retainedSessionMarkerPath).toBe(markerPath);
  });

  it("keeps Qwen blocked when the retained session marker is missing", () => {
    const controller = createController();

    const status = controller.getStatus();

    expect(status.status).toBe("blocked");
    expect(status.retainedSessionAvailable).toBe(false);
    expect(status.activeRouteSource).toBe("intent-router.deterministic.rules");
    expect(status.directActionEnabled).toBe(false);
    expect(status.browserUrlOpeningEnabled).toBe(false);
  });

  it("keeps a valid retained session default-off until explicit action", () => {
    const controller = createController({ markerAvailable: true });

    const status = controller.getStatus();

    expect(status.status).toBe("disabled");
    expect(status.retainedSessionAvailable).toBe(true);
    expect(status.explicitOptInEnabled).toBe(false);
    expect(status.controls.start).toBe("blocked");
    expect(status.controls.rollback).toBe("available");
  });

  it("fails start closed inside the Desktop product boundary", async () => {
    const controller = createController({ markerAvailable: true });

    const result = await controller.setAction({
      senderId: 1,
      expectedSenderId: 1,
      rawInput: { action: "start" },
    });

    expect(result.ok).toBe(false);
    expect(result.status.status).toBe("blocked");
    expect(result.status.activeRouteSource).toBe(
      "intent-router.deterministic.rules",
    );
    expect(result.message).toBe(
      "Qwen runtime control is disabled in the Desktop product boundary.",
    );
  });

  it("does not allow non-renderer senders to change state", async () => {
    const controller = createController({ markerAvailable: true });

    const result = await controller.setAction({
      senderId: 2,
      expectedSenderId: 1,
      rawInput: { action: "rollback" },
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Qwen runtime control is unavailable.");
    expect(controller.getStatus().status).toBe("disabled");
  });

  it("uses the bounded shutdown helper for rollback", async () => {
    const stopHelper = vi.fn().mockResolvedValue(true);
    const controller = createController({
      markerAvailable: true,
      stopHelper,
    });

    const result = await controller.setAction({
      senderId: 1,
      expectedSenderId: 1,
      rawInput: { action: "rollback" },
    });

    expect(stopHelper).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    expect(result.status.status).toBe("fallback");
    expect(result.status.helperShutdownVerified).toBe(true);
  });

  it("honors bounded route limit environment switches", () => {
    expect(qwenConversationSurfaceRouteLimit({})).toBe(3);
    expect(
      qwenConversationSurfaceRouteLimit({
        JARVIS_K_QWEN_CONVERSATION_SURFACE_USAGE: "1",
      }),
    ).toBe(5);
    expect(
      qwenConversationSurfaceRouteLimit({
        JARVIS_K_QWEN_CONVERSATION_SURFACE_EXTENDED_USAGE: "1",
      }),
    ).toBe(10);
  });
});

describe("registerQwenRuntimeIpc", () => {
  it("registers and disposes Qwen runtime handlers", async () => {
    const ipcMain = new FakeIpcMain();
    const controller = createController({ markerAvailable: true });
    const mainWindow = {
      isDestroyed: () => false,
      webContents: { id: 42 },
    };

    const dispose = registerQwenRuntimeIpc({
      ipcMain,
      qwenRuntimeController: controller,
      getMainWindow: () => mainWindow as never,
    });

    await expect(
      ipcMain.invoke(IPC_QWEN_RUNTIME_CONTROL_STATUS_CHANNEL),
    ).resolves.toMatchObject({ status: "disabled" });
    await expect(
      ipcMain.invoke(
        IPC_QWEN_RUNTIME_CONTROL_SET_CHANNEL,
        { sender: { id: 42 } },
        { action: "rollback" },
      ),
    ).resolves.toMatchObject({
      ok: true,
      status: { status: "fallback" },
    });

    dispose();

    expect(ipcMain.handlers.size).toBe(0);
  });
});
