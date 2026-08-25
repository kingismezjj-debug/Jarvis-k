import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudReasoningTransportResultSchema,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
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
import {
  GlmAdvancedBrainAcceptanceService,
  type GlmAdvancedBrainAcceptanceTransport,
  RealGlmAcceptanceTransport,
} from "../src/glm-advanced-brain-acceptance/glm-advanced-brain-acceptance-service";
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
      credentialStorageEncrypted: false,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
      operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
      fullEndpointMatch: true,
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
    expect(preflight.realRequestAttempted).toBe(false);
    expect(preflight.priorRealRequestCount).toBe(0);
  });

  it("stores model selection separately from secure credentials", async () => {
    const { credentialPath, service, settingsPath } = await createService();

    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const status = await service.getStatus();
    expect(status.selectedModelId).toBe("glm-5.3");
    expect(status.credentialConfigured).toBe(true);
    expect(status.credentialStorageEncrypted).toBe(true);
    expect(status.credentialTypeConfirmed).toBe(
      GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
    );
    expect(await readFile(settingsPath, "utf8")).toContain("glm-5.3");
    expect(await readFile(settingsPath, "utf8")).not.toContain("test-secret-key");
    const credentialFile = await readFile(credentialPath, "utf8");
    const credentialJson = JSON.parse(credentialFile) as Record<string, unknown>;
    expect(Object.keys(credentialJson).sort()).toEqual([
      "configured",
      "credentialBindingId",
      "credentialType",
      "encrypted",
      "version",
    ]);
    expect(credentialJson).toMatchObject({
      version: 1,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      credentialType: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
      configured: true,
    });
    expect(credentialFile).not.toContain("test-secret-key");
    expect(credentialFile).not.toContain("Authorization");
    expect(credentialFile).not.toContain("Bearer");
    expect(credentialFile).not.toContain(String("test-secret-key".length));
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
    await service.saveCredential(fakeCredential());
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
      endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
      operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
      fullEndpointMatch: true,
      credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
      credentialConfigured: true,
      credentialStorageEncrypted: true,
      credentialTypeConfirmed: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
      selectedModelExplicit: true,
      requestBodyFixed: true,
      maximumOutputTokens: 64,
      maxOutputTokens: 64,
      streaming: false,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      allowSingleRealAcceptance: true,
      priorRealRequestCount: 0,
      realRequestAttempted: false,
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
    await service.saveCredential(fakeCredential());

    const report = await service.runDiagnostic(consent());

    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "glm-5.2",
      stream: false,
      max_tokens: 64,
    });
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty("tools");
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty("tool_choice");
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "function_call",
    );
    expect(report).toMatchObject({
      acceptanceId: "glm-advanced-brain-acceptance-fixed-request",
      structuredResultValidation: "PASS",
      retryCount: 0,
      fallbackCount: 0,
      toolCallCount: 0,
      directActionAttempted: false,
      requestSent: false,
      responseStarted: true,
      responseCompleted: true,
      responseByteCount: 0,
      toolsObserved: false,
      executorInvocationDelta: 0,
      sanitizedResponseCategory: "fixed_diagnostic_ok",
      acceptanceConsumed: true,
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
      await service.saveCredential(fakeCredential());

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
    await endpointMismatch.service.saveCredential(fakeCredential());

    await expect(unavailable.service.getStatus()).resolves.toMatchObject({
      secureStorageAvailable: false,
      credentialConfigured: false,
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
    await service.saveCredential(fakeCredential());

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
      maxOutputTokens: 64,
      requestBodyFixed: true,
      streaming: false,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      userContentIncluded: false,
      toolCapabilityCount: 0,
    });
  });

  it("pins the exact public GLM endpoint in preflight evidence", async () => {
    const { service } = await createService();
    await service.setModel({ modelId: "glm-5.2" });
    await service.saveCredential(fakeCredential());

    const preflight = await service.preflight(consent());
    const endpoint = new URL(
      `${preflight.endpointOrigin}${preflight.operationPath}`,
    );

    expect(`${preflight.endpointOrigin}${preflight.operationPath}`).toBe(
      GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT,
    );
    expect(endpoint.href).toBe(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    );
    expect(endpoint.search).toBe("");
    expect(endpoint.hash).toBe("");
    expect(preflight.fullEndpointMatch).toBe(true);
  });

  it("uses the real acceptance transport only against the fixed public endpoint with bounded output", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init: RequestInit) => {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  diagnostic: "ok",
                  directActionAttempted: false,
                  toolCallCount: 0,
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 7,
            completion_tokens: 3,
            total_tokens: 10,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    });
    const transport = new RealGlmAcceptanceTransport(fetchImpl);
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const report = await service.runDiagnostic(consent());

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT);
    expect(init).toMatchObject({
      method: "POST",
      redirect: "error",
    });
    expect(init?.headers).toMatchObject({
      Authorization: "bearer test-secret-key",
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "glm-5.3",
      stream: false,
      max_tokens: 64,
    });
    expect(report).toMatchObject({
      requestSent: true,
      responseStarted: true,
      responseCompleted: true,
      httpStatusClass: "success",
      structuredResultValidation: "PASS",
      tokenUsage: {
        promptTokens: 7,
        completionTokens: 3,
        totalTokens: 10,
      },
      realNetworkRequestSent: true,
      acceptanceConsumed: true,
      retryCount: 0,
      fallbackCount: 0,
      toolCallCount: 0,
      toolsObserved: false,
      directActionAttempted: false,
      executorInvocationDelta: 0,
    });
    expect(JSON.stringify(report)).not.toContain("test-secret-key");
    expect(JSON.stringify(report)).not.toContain("Authorization");
    expect(JSON.stringify(report)).not.toContain("choices");
  });

  it("fails closed when secure storage cannot save a fake credential", async () => {
    const { credentialPath, service } = await createService({
      encryption: fakeEncryption(false),
    });

    const result = await service.saveCredential(fakeCredential());

    expect(result.ok).toBe(false);
    expect(result.status).toMatchObject({
      credentialConfigured: false,
      credentialStorageEncrypted: false,
      secureStorageAvailable: false,
    });
    await expect(readFile(credentialPath, "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("fails closed on decrypt failure and corrupt credential files", async () => {
    const decryptFailure = await createService({
      encryption: throwingDecryptEncryption(),
    });
    await writeFile(
      decryptFailure.credentialPath,
      JSON.stringify(
        {
          version: 1,
          credentialBindingId:
            GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
          credentialType: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
          configured: true,
          encrypted: Buffer.from("not decryptable").toString("base64"),
        },
        null,
        2,
      ),
      "utf8",
    );
    await decryptFailure.service.setModel({ modelId: "glm-5.2" });

    await expect(decryptFailure.service.getStatus()).resolves.toMatchObject({
      credentialConfigured: false,
      credentialStorageEncrypted: false,
      reasonCodes: expect.arrayContaining(["credential_invalid"]),
    });
    await expect(decryptFailure.service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: false,
      reasonCodes: expect.arrayContaining(["credential_invalid"]),
    });

    const corrupt = await createService();
    await writeFile(corrupt.credentialPath, "{bad-json", "utf8");
    await corrupt.service.setModel({ modelId: "glm-5.2" });

    await expect(corrupt.service.getStatus()).resolves.toMatchObject({
      credentialConfigured: false,
      credentialStorageEncrypted: false,
      reasonCodes: expect.arrayContaining(["credential_invalid"]),
    });
  });

  it("reports configured=false after deleting the acceptance credential", async () => {
    const { service } = await createService();
    await service.setModel({ modelId: "glm-5.2" });
    await service.saveCredential(fakeCredential());

    const result = await service.deleteCredential();

    expect(result.status).toMatchObject({
      credentialConfigured: false,
      credentialStorageEncrypted: false,
    });
    expect(result.status.reasonCodes).toEqual(["credential_missing"]);
  });

  it("rejects concurrent diagnostic runs", async () => {
    const transport = new BlockingTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.2" });
    await service.saveCredential(fakeCredential());

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

  it("allows the fixed acceptance id to be submitted only once per service session", async () => {
    const transport = new FakeTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.2" });
    await service.saveCredential(fakeCredential());

    await expect(service.runDiagnostic(consent())).resolves.toMatchObject({
      structuredResultValidation: "PASS",
    });

    await expect(service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: false,
      reasonCodes: expect.arrayContaining(["acceptance_already_submitted"]),
      realNetworkRequestSent: false,
      realRequestAttempted: false,
      priorRealRequestCount: 1,
    });
    await expect(service.runDiagnostic(consent())).rejects.toThrow(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_FAILED",
    );
    expect(transport.calls).toHaveLength(1);
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
  readonly transport?: GlmAdvancedBrainAcceptanceTransport;
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

function fakeCredential() {
  return {
    apiKey: "test-secret-key",
    credentialTypeConfirmation: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
  };
}

function fakeEncryption(available = true): SecureStringEncryption {
  return {
    isAvailable: () => available,
    encrypt: (value) => Buffer.from(`protected:${value}`, "utf8"),
    decrypt: (value) => value.toString("utf8").replace(/^protected:/u, ""),
  };
}

function throwingDecryptEncryption(): SecureStringEncryption {
  return {
    isAvailable: () => true,
    encrypt: (value) => Buffer.from(`protected:${value}`, "utf8"),
    decrypt: () => {
      throw new Error("decrypt failed");
    },
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
