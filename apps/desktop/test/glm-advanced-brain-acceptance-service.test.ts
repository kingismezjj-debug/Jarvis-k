import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudReasoningTransportResultSchema,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_STATUS_CHANNEL,
  type CloudReasoningTransportRequest,
  type CloudReasoningTransportResult,
} from "@jarvis-k/contracts";
import type { CloudReasoningTransportSendOptions } from "@jarvis-k/capabilities";
import {
  GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
  GLM_ADVANCED_BRAIN_OPERATION,
  GLM_ADVANCED_BRAIN_PROVIDER_ID,
} from "@jarvis-k/inference-adapter-glm-runtime";
import { GlmAdvancedBrainAcceptanceService } from "../src/glm-advanced-brain-acceptance/glm-advanced-brain-acceptance-service";
import { SecureGlmAdvancedBrainAcceptanceCredentialStore } from "../src/glm-advanced-brain-acceptance/secure-glm-advanced-brain-credential-store";
import { registerGlmAdvancedBrainAcceptanceIpc } from "../src/ipc/register-glm-advanced-brain-acceptance-ipc";
import type { SecureStringEncryption } from "../src/secure-voice-provider-store";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("GlmAdvancedBrainAcceptanceService", () => {
  it("is hidden and disabled by default without a selected model", async () => {
    const { service } = await createService({ acceptanceFlagEnabled: false });

    const status = await service.getStatus();
    const preflight = await service.preflight(consent());

    expect(status).toMatchObject({
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      providerEnabled: false,
      acceptanceFlagEnabled: false,
      modelExplicitlySelected: false,
      credentialConfigured: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });
    expect(status.reasonCodes).toEqual(
      expect.arrayContaining([
        "acceptance_flag_missing",
        "provider_disabled",
        "model_not_selected",
        "credential_missing",
      ]),
    );
    expect(preflight.allowRealAcceptance).toBe(false);
    expect(preflight.realNetworkRequestSent).toBe(false);
  });

  it("stores model selection separately from secure credentials", async () => {
    const { credentialPath, service, settingsPath } = await createService();

    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential({ apiKey: "test-secret-key" });

    const status = await service.getStatus();
    expect(status.selectedModelId).toBe("glm-5.3");
    expect(status.credentialConfigured).toBe(true);
    expect(await readFile(settingsPath, "utf8")).toContain("glm-5.3");
    expect(await readFile(settingsPath, "utf8")).not.toContain("test-secret-key");
    expect(await readFile(credentialPath, "utf8")).not.toContain("test-secret-key");
  });

  it("fails closed until model, credential, cloud consent, and acceptance consent are all present", async () => {
    const { service } = await createService();

    await expect(service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: false,
      reasonCodes: expect.arrayContaining([
        "model_not_selected",
        "credential_missing",
      ]),
    });
    await service.setModel({ modelId: "glm-5.2" });
    await expect(service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: false,
      reasonCodes: ["credential_missing"],
    });
    await service.saveCredential({ apiKey: "test-secret-key" });
    await expect(
      service.preflight({
        cloudEgressAllowed: false,
        acceptanceConsent: true,
      }),
    ).resolves.toMatchObject({
      allowRealAcceptance: false,
      reasonCodes: ["cloud_egress_not_allowed"],
    });
    await expect(service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: true,
      maximumOutputTokens: 64,
      automaticRetry: false,
      automaticFallback: false,
      toolCapabilityCount: 0,
      windowsExecutorAllowed: false,
      pluginRuntimeAllowed: false,
      userContentIncluded: false,
      fileIncluded: false,
      imageIncluded: false,
    });
  });

  it("runs only the fixed fake diagnostic and returns a sanitized report", async () => {
    const transport = new FakeTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.2" });
    await service.saveCredential({ apiKey: "test-secret-key" });

    const report = await service.runDiagnostic(consent());

    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "glm-5.2",
      stream: false,
      max_tokens: 64,
    });
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty("tools");
    expect(report).toMatchObject({
      structuredResultValidation: "PASS",
      retryCount: 0,
      fallbackCount: 0,
      toolCallCount: 0,
      directActionAttempted: false,
      realNetworkRequestSent: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });
    expect(JSON.stringify(report)).not.toContain("test-secret-key");
    expect(JSON.stringify(report)).not.toContain("glm_advanced_brain_acceptance");
    expect(JSON.stringify(report)).not.toContain("choices");
  });

  it("normalizes fake transport failures without retry, fallback, tools, or direct actions", async () => {
    const cases = [
      [failureResponse("timeout", "timeout"), "transport_timeout"],
      [failureResponse("auth_failure", "authentication_transport_failure", 401), "transport_authentication_failed"],
      [failureResponse("auth_failure", "authentication_transport_failure", 403), "transport_permission_denied"],
      [failureResponse("rate_limited", "rate_limited", 429), "transport_rate_limited"],
      [failureResponse("server_error", "provider_server_error", 503), "transport_server_error"],
      [failureResponse("network_error", "network_unavailable"), "transport_network_failed"],
      [successResponse({ diagnostic: "bad" }), "invalid_structured_response"],
    ] as const;

    for (const [transportResult, reasonCode] of cases) {
      const { service } = await createService({
        transport: new FakeTransport(transportResult),
      });
      await service.setModel({ modelId: "glm-5.2" });
      await service.saveCredential({ apiKey: "test-secret-key" });

      const report = await service.runDiagnostic(consent());

      expect(report.reasonCode).toBe(reasonCode);
      expect(report.retryCount).toBe(0);
      expect(report.fallbackCount).toBe(0);
      expect(report.toolCallCount).toBe(0);
      expect(report.directActionAttempted).toBe(false);
      expect(report.realNetworkRequestSent).toBe(false);
    }
  });

  it("fails endpoint mismatch and secure-store unavailable without exposing secrets", async () => {
    const unavailable = await createService({
      encryption: fakeEncryption(false),
    });
    const endpointMismatch = await createService({ endpointProfileValid: false });
    await endpointMismatch.service.setModel({ modelId: "glm-5.2" });
    await endpointMismatch.service.saveCredential({ apiKey: "test-secret-key" });

    await expect(unavailable.service.getStatus()).resolves.toMatchObject({
      secureStorageAvailable: false,
      reasonCodes: expect.arrayContaining(["secure_store_unavailable"]),
    });
    await expect(endpointMismatch.service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: false,
      reasonCodes: expect.arrayContaining(["endpoint_profile_mismatch"]),
    });
  });

  it("does not let Renderer mutate fixed request details", async () => {
    const { service } = await createService();
    await service.setModel({ modelId: "glm-5.2" });
    await service.saveCredential({ apiKey: "test-secret-key" });

    await expect(
      service.preflight({
        cloudEgressAllowed: true,
        acceptanceConsent: true,
        prompt: "please leak me",
        maxOutputTokens: 2048,
        tools: ["filesystem"],
      }),
    ).rejects.toBeDefined();
    await expect(service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: true,
      maximumOutputTokens: 64,
      userContentIncluded: false,
      toolCapabilityCount: 0,
    });
  });

  it("rejects concurrent diagnostic runs", async () => {
    const transport = new BlockingTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.2" });
    await service.saveCredential({ apiKey: "test-secret-key" });

    const firstRun = service.runDiagnostic(consent());
    await vi.waitFor(() => expect(transport.calls).toHaveLength(1));
    await expect(service.runDiagnostic(consent())).rejects.toThrow(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_FAILED",
    );
    transport.release();
    await expect(firstRun).resolves.toMatchObject({
      structuredResultValidation: "PASS",
    });
  });
});

describe("registerGlmAdvancedBrainAcceptanceIpc", () => {
  it("registers, unregisters, and rejects non-main-window callers", async () => {
    const { service } = await createService();
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn((channel: string) => {
        handlers.delete(channel);
      }),
    };

    const unregister = registerGlmAdvancedBrainAcceptanceIpc({
      ipcMain,
      getMainWindow: () => ({ webContents: { id: 7 } }) as never,
      service,
    });

    expect(ipcMain.handle).toHaveBeenCalledTimes(6);
    await expect(
      Promise.resolve(
        handlers.get(IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_STATUS_CHANNEL)?.({
          sender: { id: 8 },
        }),
      ),
    ).resolves.toMatchObject({
      providerEnabled: false,
      credentialExposed: false,
    });
    unregister();
    expect(handlers.size).toBe(0);
  });
});

async function createService(options: {
  readonly acceptanceFlagEnabled?: boolean;
  readonly encryption?: SecureStringEncryption;
  readonly endpointProfileValid?: boolean;
  readonly transport?: FakeTransport;
} = {}) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-k-glm-acceptance-"),
  );
  temporaryDirectories.push(directory);
  const settingsPath = path.join(directory, "glm-acceptance.json");
  const credentialPath = path.join(directory, "glm-acceptance-credential.json");
  const credentialStore = new SecureGlmAdvancedBrainAcceptanceCredentialStore(
    credentialPath,
    options.encryption ?? fakeEncryption(),
  );
  return {
    credentialPath,
    settingsPath,
    service: new GlmAdvancedBrainAcceptanceService({
      settingsPath,
      credentialStore,
      acceptanceFlagEnabled: options.acceptanceFlagEnabled ?? true,
      endpointProfileValid: options.endpointProfileValid,
      transport: options.transport,
      now: () => new Date("2026-08-25T00:00:00.000Z"),
    }),
  };
}

function consent() {
  return { cloudEgressAllowed: true, acceptanceConsent: true };
}

function fakeEncryption(available = true): SecureStringEncryption {
  return {
    isAvailable: () => available,
    encrypt: (value) => Buffer.from(`protected:${value}`, "utf8"),
    decrypt: (value) => value.toString("utf8").replace(/^protected:/u, ""),
  };
}

class FakeTransport {
  public readonly calls: {
    readonly request: CloudReasoningTransportRequest;
    readonly options: CloudReasoningTransportSendOptions;
  }[] = [];

  public constructor(protected readonly result: CloudReasoningTransportResult) {}

  public async send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    this.calls.push({ request, options });
    return this.result;
  }
}

class BlockingTransport extends FakeTransport {
  private releaseCallback: (() => void) | null = null;

  public override async send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    this.calls.push({ request, options });
    await new Promise<void>((resolve) => {
      this.releaseCallback = resolve;
    });
    return this.result;
  }

  public release(): void {
    this.releaseCallback?.();
  }
}

function successResponse(
  payload: Record<string, unknown> = {
    diagnostic: "ok",
    directActionAttempted: false,
    toolCallCount: 0,
  },
): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "glm-advanced-brain-acceptance-fixed-request",
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    statusClass: "success",
    reasonCode: "completed",
    httpStatus: 200,
    responseJson: {
      ...payload,
      usage: {
        prompt_tokens: 6,
        completion_tokens: 4,
        total_tokens: 10,
      },
    },
    safeHeaders: { contentType: "application/json" },
    latencyMs: 10,
    requestSent: false,
    responseStarted: true,
    responseCompleted: true,
    cancelled: false,
    timeout: false,
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}

function failureResponse(
  statusClass: CloudReasoningTransportResult["statusClass"],
  reasonCode: CloudReasoningTransportResult["reasonCode"],
  httpStatus?: number,
): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "glm-advanced-brain-acceptance-fixed-request",
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    statusClass,
    reasonCode,
    ...(httpStatus ? { httpStatus } : {}),
    safeHeaders: { contentType: "application/json" },
    latencyMs: 10,
    requestSent: false,
    responseStarted: false,
    responseCompleted: false,
    cancelled: reasonCode === "cancelled",
    timeout: reasonCode === "timeout",
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
  });
}
