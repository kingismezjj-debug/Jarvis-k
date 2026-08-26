import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudReasoningTransportRequestSchema,
  CloudReasoningTransportResultSchema,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_FULL_ENDPOINT,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_V1_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_V2_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_V3_ID,
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
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "blocked",
      providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
      providerEnabled: false,
      acceptanceFlagEnabled: false,
      modelExplicitlySelected: false,
      credentialConfigured: false,
      credentialStorageEncrypted: false,
      acceptanceConsumed: false,
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
    expect(preflight.acceptanceId).toBe(GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID);
    expect(preflight.acceptanceVersion).toBe(
      GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
    );
    expect(preflight.acceptanceState).toBe("blocked");
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
      reasonCodes: expect.arrayContaining(["model_not_selected"]),
    });
    await service.setModel({ modelId: "glm-5.3" });
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
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "ready",
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
      requestContractId: "glm-5.3-fixed-diagnostic-mandatory-thinking-v2",
      requestContractProfileId:
        "glm-5.3-fixed-diagnostic-mandatory-thinking-v2",
      maximumOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      maxOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      mandatoryThinking: true,
      thinkingType: "enabled",
      thinkingDisabled: false,
      responseFormatPresent: false,
      samplingMode: "deterministic",
      requestedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      effectiveTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      timeoutBounded: true,
      boundedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
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
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const report = await service.runDiagnostic(consent());

    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: "glm-5.3",
      stream: false,
      max_tokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      thinking: { type: "enabled" },
      do_sample: false,
    });
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "max_output_tokens",
    );
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "response_format",
    );
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "temperature",
    );
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty("tools");
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty("tool_choice");
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "function_call",
    );
    expect(report).toMatchObject({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "consumed",
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
      contentTypeAllowed: true,
      jsonDecoded: true,
      choicesPresent: true,
      finalContentPresent: true,
      reasoningContentObserved: false,
      finishReason: "unknown",
      usagePresent: true,
      outputValidationCategory: "fixed_diagnostic_ok",
      sanitizedResponseCategory: "fixed_diagnostic_ok",
      acceptanceConsumed: true,
      realNetworkRequestSent: false,
      providerErrorCategory: "none",
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });
    expect(JSON.stringify(report)).not.toContain("test-secret-key");
    expect(JSON.stringify(report)).not.toContain("glm_advanced_brain_acceptance");
    expect(JSON.stringify(report)).not.toContain('"choices":');
    expect(report.acceptanceId).not.toBe(GLM_ADVANCED_BRAIN_ACCEPTANCE_V1_ID);
    expect(report.acceptanceId).not.toBe(GLM_ADVANCED_BRAIN_ACCEPTANCE_V2_ID);
    expect(report.acceptanceId).not.toBe(GLM_ADVANCED_BRAIN_ACCEPTANCE_V3_ID);
  });

  it("normalizes fake transport failures without retry, fallback, tools, or direct actions", async () => {
    const cases = [
      [failureResponse("timeout", "timeout"), "transport_timeout"],
      [failureResponse("cancelled", "cancelled"), "transport_cancelled"],
      [failureResponse("auth_failure", "authentication_transport_failure", 401), "transport_authentication_failed"],
      [failureResponse("auth_failure", "authentication_transport_failure", 403), "transport_permission_denied"],
      [failureResponse("rate_limited", "rate_limited", 429), "transport_rate_limited"],
      [failureResponse("server_error", "provider_server_error", 503), "transport_server_error"],
      [failureResponse("network_error", "network_unavailable"), "transport_network_failed"],
      [successResponse({ diagnostic: "bad" }), "invalid_provider_output"],
    ] as const;

    for (const [transportResult, reasonCode] of cases) {
      const { service } = await createService({
        transport: new FakeTransport(transportResult),
      });
      await service.setModel({ modelId: "glm-5.3" });
      await service.saveCredential(fakeCredential());

      const report = await service.runDiagnostic(consent());

      expect(report.reasonCode).toBe(reasonCode);
      expect(report.retryCount).toBe(0);
      expect(report.fallbackCount).toBe(0);
      expect(report.toolCallCount).toBe(0);
      expect(report.directActionAttempted).toBe(false);
      expect(report.realNetworkRequestSent).toBe(false);
      if (
        reasonCode === "transport_timeout" ||
        reasonCode === "transport_cancelled" ||
        reasonCode === "transport_network_failed"
      ) {
        expect(report.providerErrorCategory).toBe("not_applicable");
      }
      if (reasonCode === "transport_authentication_failed") {
        expect(report.providerErrorCategory).toBe("credential_rejected");
      }
      await expect(service.preflight(consent())).resolves.toMatchObject({
        acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
        acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
        acceptanceState: "consumed",
        allowRealAcceptance: false,
        priorRealRequestCount: 1,
        realRequestAttempted: true,
        allowSingleRealAcceptance: false,
        reasonCodes: expect.arrayContaining(["acceptance_already_consumed"]),
      });
    }
  });

  it("consumes acceptance on authentication failure and refreshes preflight projection", async () => {
    const transport = new FakeTransport(
      failureResponse(
        "auth_failure",
        "authentication_transport_failure",
        401,
        {
          responseByteCount: 59,
          responseJson: {
            error: {
              message: "fake raw auth provider message",
              request_id: "fake-provider-request-id",
            },
          },
        },
      ),
    );
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const before = await service.preflight(consent());
    const report = await service.runDiagnostic(consent());
    const after = await service.preflight(consent());

    expect(before).toMatchObject({
      allowRealAcceptance: true,
      priorRealRequestCount: 0,
      realRequestAttempted: false,
      allowSingleRealAcceptance: true,
    });
    expect(report).toMatchObject({
      requestSent: false,
      httpStatusClass: "auth_failure",
      responseByteCount: 59,
      reasonCode: "transport_authentication_failed",
      providerErrorCategory: "credential_rejected",
      acceptanceConsumed: true,
      retryCount: 0,
      fallbackCount: 0,
      toolCallCount: 0,
      toolsObserved: false,
      executorInvocationDelta: 0,
    });
    expect(after).toMatchObject({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "consumed",
      allowRealAcceptance: false,
      priorRealRequestCount: 1,
      realRequestAttempted: true,
      allowSingleRealAcceptance: false,
      reasonCodes: ["acceptance_already_consumed"],
    });
    expect(JSON.stringify(report)).not.toContain("fake raw auth provider message");
    expect(JSON.stringify(report)).not.toContain("fake-provider-request-id");
  });

  it("does not let stale preflight, credential replacement, or credential deletion permit a second request", async () => {
    const transport = new FakeTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    await expect(service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: true,
    });
    await expect(service.runDiagnostic(consent())).resolves.toMatchObject({
      acceptanceConsumed: true,
    });
    await service.saveCredential({
      ...fakeCredential(),
      apiKey: "fixture-key",
    });
    await expect(service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: false,
      reasonCodes: expect.arrayContaining(["acceptance_already_consumed"]),
    });
    await service.deleteCredential();
    const status = await service.getStatus();
    const preflight = await service.preflight(consent());

    expect(status).toMatchObject({
      credentialConfigured: false,
      acceptanceConsumed: true,
    });
    expect(preflight).toMatchObject({
      allowRealAcceptance: false,
      priorRealRequestCount: 1,
      realRequestAttempted: true,
      allowSingleRealAcceptance: false,
    });
    expect(preflight.reasonCodes).toEqual(
      expect.arrayContaining([
        "credential_missing",
        "acceptance_already_consumed",
      ]),
    );
    await expect(service.runDiagnostic(consent())).rejects.toThrow(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_FAILED",
    );
    expect(transport.calls).toHaveLength(1);
  });

  it("keeps consumed state in Main service across renderer recreation", async () => {
    const transport = new FakeTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    await service.runDiagnostic(consent());
    const rendererViewA = await service.preflight(consent());
    const rendererViewB = await service.preflight(consent());

    expect(rendererViewA).toMatchObject({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      allowRealAcceptance: false,
      priorRealRequestCount: 1,
    });
    expect(rendererViewB).toMatchObject({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      allowRealAcceptance: false,
      realRequestAttempted: true,
    });
    expect(transport.calls).toHaveLength(1);
  });

  it("allows only one transport invocation under concurrent double-click", async () => {
    const transport = new BlockingTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const firstRun = service.runDiagnostic(consent());
    const secondRun = service
      .runDiagnostic(consent())
      .then(
        () => "resolved" as const,
        (error: unknown) => error,
      );
    await vi.waitFor(() => expect(transport.calls).toHaveLength(1));
    await expect(service.getStatus()).resolves.toMatchObject({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "running",
      acceptanceConsumed: true,
    });
    await expect(service.preflight(consent())).resolves.toMatchObject({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      acceptanceState: "running",
      allowRealAcceptance: false,
      priorRealRequestCount: 1,
      realRequestAttempted: true,
      allowSingleRealAcceptance: false,
      reasonCodes: expect.arrayContaining([
        "acceptance_already_running",
        "acceptance_already_consumed",
      ]),
    });
    expect(await secondRun).toEqual(
      expect.objectContaining({
        message: "GLM_ADVANCED_BRAIN_ACCEPTANCE_ALREADY_RUNNING",
      }),
    );
    transport.release();
    await expect(firstRun).resolves.toMatchObject({
      acceptanceConsumed: true,
    });
    expect(transport.calls).toHaveLength(1);
  });

  it("fails endpoint mismatch and secure-store unavailable without exposing secrets", async () => {
    const unavailable = await createService({
      encryption: fakeEncryption(false),
    });
    const endpointMismatch = await createService({ endpointProfileValid: false });
    await endpointMismatch.service.setModel({ modelId: "glm-5.3" });
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
    const transport = new FakeTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const forgedRequest = {
      cloudEgressAllowed: true,
      acceptanceConsent: true,
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_V1_ID,
      timeoutMs: 1,
      prompt: "please leak me",
      maxOutputTokens: 2048,
      tools: ["filesystem"],
    };

    await expect(service.preflight(forgedRequest)).rejects.toBeDefined();
    await expect(service.runDiagnostic(forgedRequest)).rejects.toBeDefined();
    expect(transport.calls).toHaveLength(0);
    await expect(service.preflight(consent())).resolves.toMatchObject({
      acceptanceId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
      acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION,
      allowRealAcceptance: true,
      requestContractId: "glm-5.3-fixed-diagnostic-mandatory-thinking-v2",
      requestContractProfileId:
        "glm-5.3-fixed-diagnostic-mandatory-thinking-v2",
      maximumOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      maxOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      mandatoryThinking: true,
      thinkingType: "enabled",
      thinkingDisabled: false,
      responseFormatPresent: false,
      samplingMode: "deterministic",
      requestedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      effectiveTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      timeoutBounded: true,
      boundedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
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
    await service.setModel({ modelId: "glm-5.3" });
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

  it("projects the model-specific GLM-5.3 mandatory-thinking contract", async () => {
    const transport = new FakeTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const preflight = await service.preflight(consent());
    const report = await service.runDiagnostic(consent());
    const body = transport.calls[0]?.request.bodyJson as Record<string, unknown>;

    expect(preflight).toMatchObject({
      modelId: "glm-5.3",
      requestContractId: "glm-5.3-fixed-diagnostic-mandatory-thinking-v2",
      requestContractProfileId:
        "glm-5.3-fixed-diagnostic-mandatory-thinking-v2",
      maxOutputTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      mandatoryThinking: true,
      thinkingType: "enabled",
      thinkingDisabled: false,
      responseFormatPresent: false,
      samplingMode: "deterministic",
      requestedTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      effectiveTimeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
      timeoutBounded: true,
    });
    expect(body).toMatchObject({
      model: "glm-5.3",
      stream: false,
      max_tokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      thinking: { type: "enabled" },
      do_sample: false,
    });
    expect(body).not.toHaveProperty("reasoning_effort");
    expect(body).not.toHaveProperty("max_output_tokens");
    expect(body).not.toHaveProperty("response_format");
    expect(body).not.toHaveProperty("temperature");
    expect(body).not.toHaveProperty("top_p");
    expect(report.acceptanceConsumed).toBe(true);
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
      Authorization: "Bearer test-secret-key",
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "glm-5.3",
      stream: false,
      max_tokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      thinking: { type: "enabled" },
      do_sample: false,
    });
    expect(JSON.parse(String(init?.body))).not.toHaveProperty(
      "reasoning_effort",
    );
    expect(JSON.parse(String(init?.body))).not.toHaveProperty(
      "max_output_tokens",
    );
    expect(JSON.parse(String(init?.body))).not.toHaveProperty(
      "response_format",
    );
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("temperature");
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("top_p");
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
      providerErrorCategory: "none",
      outputValidationCategory: "fixed_diagnostic_ok",
      contentTypeAllowed: true,
      jsonDecoded: true,
      choicesPresent: true,
      finalContentPresent: true,
      reasoningContentObserved: false,
      finishReason: "absent",
      usagePresent: true,
      retryCount: 0,
      fallbackCount: 0,
      toolCallCount: 0,
      toolsObserved: false,
      directActionAttempted: false,
      executorInvocationDelta: 0,
    });
    expect(JSON.stringify(report)).not.toContain("test-secret-key");
    expect(JSON.stringify(report)).not.toContain("Authorization");
    expect(JSON.stringify(report)).not.toContain('"choices":');
  });

  it("parses GLM-5.3 reasoning_content only as safe evidence when final content is valid", async () => {
    const report = await runRealTransportFixture(
      glmChatCompletionResponse({
        choices: [
          {
            finish_reason: "stop",
            message: {
              reasoning_content: "private chain of thought must not leak",
              content: JSON.stringify({
                diagnostic: "ok",
                directActionAttempted: false,
                toolCallCount: 0,
              }),
            },
          },
        ],
      }),
    );

    expect(report).toMatchObject({
      httpStatus: 200,
      httpStatusClass: "success",
      structuredResultValidation: "PASS",
      outputValidationCategory: "fixed_diagnostic_ok",
      providerErrorCategory: "none",
      contentTypeAllowed: true,
      jsonDecoded: true,
      choicesPresent: true,
      finalContentPresent: true,
      reasoningContentObserved: true,
      finishReason: "stop",
      usagePresent: true,
    });
    expect(JSON.stringify(report)).not.toContain("private chain of thought");
    expect(JSON.stringify(report)).not.toContain("reasoning_content");
  });

  it("accepts one markdown JSON fence around the final diagnostic content", async () => {
    const report = await runRealTransportFixture(
      glmChatCompletionResponse({
        choices: [
          {
            finish_reason: "stop",
            message: {
              reasoning_content: "private chain of thought must not leak",
              content:
                "```json\n{\"diagnostic\":\"ok\",\"directActionAttempted\":false,\"toolCallCount\":0}\n```",
            },
          },
        ],
      }),
    );

    expect(report).toMatchObject({
      httpStatus: 200,
      httpStatusClass: "success",
      structuredResultValidation: "PASS",
      outputValidationCategory: "fixed_diagnostic_ok",
      reasoningContentObserved: true,
      finalContentPresent: true,
      finishReason: "stop",
    });
    expect(JSON.stringify(report)).not.toContain("private chain of thought");
    expect(JSON.stringify(report)).not.toContain("reasoning_content");
  });

  it("classifies GLM-5.3 token exhaustion before final content separately", async () => {
    const report = await runRealTransportFixture(
      glmChatCompletionResponse({
        choices: [
          {
            finish_reason: "length",
            message: {
              reasoning_content: "budget used internally",
              content: "",
            },
          },
        ],
      }),
    );

    expect(report).toMatchObject({
      httpStatusClass: "invalid_response",
      reasonCode: "output_budget_exhausted_before_final",
      providerErrorCategory: "output_budget_exhausted_before_final",
      outputValidationCategory: "output_budget_exhausted_before_final",
      reasoningContentObserved: true,
      finalContentPresent: false,
      finishReason: "length",
      tokenUsage: {
        promptTokens: 7,
        completionTokens: 3,
        totalTokens: 10,
      },
    });
  });

  it("classifies reasoning without final content as no_final_answer", async () => {
    const report = await runRealTransportFixture(
      glmChatCompletionResponse({
        choices: [
          {
            finish_reason: "stop",
            message: {
              reasoning_content: "reasoning only",
              content: null,
            },
          },
        ],
      }),
    );

    expect(report).toMatchObject({
      httpStatusClass: "invalid_response",
      reasonCode: "no_final_answer",
      providerErrorCategory: "no_final_answer",
      outputValidationCategory: "no_final_answer",
      reasoningContentObserved: true,
      finalContentPresent: false,
      finishReason: "stop",
    });
  });

  it("fails closed on untrusted provider tool proposals without accepting tool calls", async () => {
    const report = await runRealTransportFixture(
      glmChatCompletionResponse({
        choices: [
          {
            finish_reason: "tool_calls",
            message: {
              content: JSON.stringify({
                diagnostic: "ok",
                directActionAttempted: false,
                toolCallCount: 0,
              }),
              tool_calls: [
                {
                  type: "function",
                  function: { name: "unsafe" },
                },
              ],
            },
          },
        ],
      }),
    );

    expect(report).toMatchObject({
      httpStatusClass: "invalid_response",
      reasonCode: "untrusted_tool_proposal_blocked",
      providerErrorCategory: "untrusted_tool_proposal_blocked",
      outputValidationCategory: "untrusted_tool_proposal_blocked",
      toolCallCount: 0,
      toolsObserved: false,
      directActionAttempted: false,
      executorInvocationDelta: 0,
      finishReason: "tool_calls",
    });
  });

  it("separates HTTP provider errors from malformed 2xx output", async () => {
    const malformed = await runRealTransportFixture(
      new Response("{bad-json", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const emptyChoices = await runRealTransportFixture(
      glmChatCompletionResponse({ choices: [] }),
    );
    const http401 = await runRealTransportFixture(
      new Response(
        JSON.stringify({
          error: {
            message: "raw provider auth text must not leak",
          },
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    expect(malformed).toMatchObject({
      httpStatus: 200,
      httpStatusClass: "invalid_response",
      reasonCode: "invalid_provider_output",
      providerErrorCategory: "invalid_provider_output",
      outputValidationCategory: "invalid_provider_output",
      jsonDecoded: false,
      choicesPresent: false,
    });
    expect(emptyChoices).toMatchObject({
      httpStatus: 200,
      httpStatusClass: "invalid_response",
      reasonCode: "invalid_provider_output",
      outputValidationCategory: "invalid_provider_output",
      jsonDecoded: true,
      choicesPresent: false,
    });
    expect(http401).toMatchObject({
      httpStatus: 401,
      httpStatusClass: "auth_failure",
      reasonCode: "transport_authentication_failed",
      providerErrorCategory: "credential_rejected",
      outputValidationCategory: "provider_http_error",
    });
    expect(JSON.stringify(http401)).not.toContain("raw provider auth text");
  });

  it("uses the 30000 ms acceptance timeout without aborting a 29999 ms success", async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn(
        async (_url: string, _init: RequestInit) =>
          new Promise<Response>((resolve) => {
            setTimeout(() => resolve(glmChatCompletionResponse()), 29_999);
          }),
      );
      const transport = new RealGlmAcceptanceTransport(fetchImpl);

      const resultPromise = transport.send(fixedTransportRequest(), {
        credential: { scheme: "bearer", value: "test-secret-key" },
      });
      await vi.advanceTimersByTimeAsync(29_999);

      await expect(resultPromise).resolves.toMatchObject({
        requestSent: true,
        responseStarted: true,
        responseCompleted: true,
        statusClass: "success",
        reasonCode: "completed",
        timeout: false,
        cancelled: false,
      });
      const [, init] = fetchImpl.mock.calls[0] ?? [];
      expect(JSON.parse(String(init?.body))).toMatchObject({
      stream: false,
      max_tokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
    });
    } finally {
      vi.useRealTimers();
    }
  });

  it("aborts the fixed acceptance request at the 30000 ms boundary", async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn(
        async (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init.signal as AbortSignal;
            signal.addEventListener("abort", () => {
              reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
            });
          }),
      );
      const transport = new RealGlmAcceptanceTransport(fetchImpl);

      const resultPromise = transport.send(fixedTransportRequest(), {
        credential: { scheme: "bearer", value: "test-secret-key" },
      });
      await vi.advanceTimersByTimeAsync(30_000);

      await expect(resultPromise).resolves.toMatchObject({
        requestSent: true,
        responseStarted: false,
        responseCompleted: false,
        responseByteCount: 0,
        statusClass: "timeout",
        reasonCode: "timeout",
        timeout: true,
        cancelled: false,
        automaticRetry: false,
        automaticFallback: false,
      });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("classifies external cancellation separately from acceptance timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn(
        async (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init.signal as AbortSignal;
            signal.addEventListener("abort", () => {
              reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
            });
          }),
      );
      const transport = new RealGlmAcceptanceTransport(fetchImpl);
      const controller = new AbortController();

      const resultPromise = transport.send(fixedTransportRequest(), {
        credential: { scheme: "bearer", value: "test-secret-key" },
        signal: controller.signal,
      });
      controller.abort();

      await expect(resultPromise).resolves.toMatchObject({
        requestSent: true,
        responseStarted: false,
        responseCompleted: false,
        responseByteCount: 0,
        statusClass: "cancelled",
        reasonCode: "cancelled",
        timeout: false,
        cancelled: true,
        automaticRetry: false,
        automaticFallback: false,
      });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
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
    await decryptFailure.service.setModel({ modelId: "glm-5.3" });

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
    await corrupt.service.setModel({ modelId: "glm-5.3" });

    await expect(corrupt.service.getStatus()).resolves.toMatchObject({
      credentialConfigured: false,
      credentialStorageEncrypted: false,
      reasonCodes: expect.arrayContaining(["credential_invalid"]),
    });
  });

  it("reports configured=false after deleting the acceptance credential", async () => {
    const { service } = await createService();
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const result = await service.deleteCredential();

    expect(result.status).toMatchObject({
      credentialConfigured: false,
      credentialStorageEncrypted: false,
    });
    expect(result.status.reasonCodes).toEqual(["credential_missing"]);
  });

  it("trims credential edges but rejects pasted bearer headers", async () => {
    const transport = new FakeTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });

    await service.saveCredential({
      apiKey: "  fixture-secret  ",
      credentialTypeConfirmation: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
    });
    await service.runDiagnostic(consent());
    expect(transport.calls[0]?.options.credential.value).toBe(
      "fixture-secret",
    );

    const rejected = await createService();
    const result = await rejected.service.saveCredential({
      apiKey: "Bearer placeholder-token",
      credentialTypeConfirmation: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
    });
    expect(result).toMatchObject({
      ok: false,
      status: { credentialConfigured: false },
    });
  });

  it("rejects concurrent diagnostic runs", async () => {
    const transport = new BlockingTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    const firstRun = service.runDiagnostic(consent());
    await vi.waitFor(() => expect(transport.calls).toHaveLength(1));
    await expect(service.runDiagnostic(consent())).rejects.toThrow(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_ALREADY_RUNNING",
    );
    transport.release();
    await expect(firstRun).resolves.toMatchObject({
      structuredResultValidation: "PASS",
    });
  });

  it("allows the fixed acceptance id to be submitted only once per service session", async () => {
    const transport = new FakeTransport(successResponse());
    const { service } = await createService({ transport });
    await service.setModel({ modelId: "glm-5.3" });
    await service.saveCredential(fakeCredential());

    await expect(service.runDiagnostic(consent())).resolves.toMatchObject({
      structuredResultValidation: "PASS",
    });

    await expect(service.preflight(consent())).resolves.toMatchObject({
      allowRealAcceptance: false,
      reasonCodes: expect.arrayContaining(["acceptance_already_consumed"]),
      realNetworkRequestSent: false,
      realRequestAttempted: true,
      priorRealRequestCount: 1,
    });
    await expect(service.runDiagnostic(consent())).rejects.toThrow(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_FAILED",
    );
    expect(transport.calls).toHaveLength(1);
  });

  it("keeps the v4 acceptance identity Main-owned and non-overridable", () => {
    const serviceSource = readFileSync(
      path.resolve(
        import.meta.dirname,
        "..",
        "src",
        "glm-advanced-brain-acceptance",
        "glm-advanced-brain-acceptance-service.ts",
      ),
      "utf8",
    );
    const ipcSource = readFileSync(
      path.resolve(
        import.meta.dirname,
        "..",
        "src",
        "ipc",
        "register-glm-advanced-brain-acceptance-ipc.ts",
      ),
      "utf8",
    );
    const preloadSource = readFileSync(
      path.resolve(import.meta.dirname, "..", "src", "preload.ts"),
      "utf8",
    );
    const productGlmProviderSource = readFileSync(
      path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "..",
        "packages",
        "inference-adapter-glm-runtime",
        "src",
        "advanced-brain-provider.ts",
      ),
      "utf8",
    );
    const contractsSource = readFileSync(
      path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "..",
        "packages",
        "contracts",
        "src",
        "glm-advanced-brain-acceptance-protocol.ts",
      ),
      "utf8",
    );

    expect(serviceSource).toContain(
      "requestId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID",
    );
    expect(serviceSource).toContain(
      "acceptanceVersion: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION",
    );
    expect(serviceSource).not.toContain("process.env");
    expect(serviceSource).not.toContain("randomUUID");
    expect(serviceSource).not.toContain("crypto.random");
    expect(serviceSource).not.toContain("acceptanceVersion++");
    expect(serviceSource).not.toContain("acceptanceVersion +");
    expect(serviceSource).toContain(
      'profileId: "glm-5.3-fixed-diagnostic-mandatory-thinking-v2"',
    );
    expect(serviceSource).toContain(
      "maxTokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS",
    );
    expect(serviceSource).not.toContain("fixed-request-v5");
    expect(ipcSource).toContain(
      "GlmAdvancedBrainAcceptanceConsentRequestSchema.parse(rawInput)",
    );
    expect(preloadSource).toContain(
      "GlmAdvancedBrainAcceptanceConsentRequestSchema.parse(request)",
    );
    expect(preloadSource).not.toContain(
      "glm-advanced-brain-acceptance-fixed-request-v2",
    );
    expect(preloadSource).not.toContain(
      "glm-advanced-brain-acceptance-fixed-request-v3",
    );
    expect(preloadSource).not.toContain(
      "glm-advanced-brain-acceptance-fixed-request-v4",
    );
    expect(contractsSource).toContain(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID",
    );
    expect(contractsSource).toContain(
      "glm-advanced-brain-acceptance-fixed-request-v4",
    );
    expect(contractsSource).toContain(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_VERSION = 4",
    );
    expect(contractsSource).toContain(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS = 1024",
    );
    expect(contractsSource).not.toContain(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS = 64",
    );
    expect(contractsSource).not.toContain(
      "GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS = 512",
    );
    expect(productGlmProviderSource).toContain(
      "export const GLM_ADVANCED_BRAIN_DEFAULT_TIMEOUT_MS = 45_000",
    );
    expect(productGlmProviderSource).toContain("maxTimeoutMs: 120_000");
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

function fixedTransportRequest(): CloudReasoningTransportRequest {
  return CloudReasoningTransportRequestSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    method: "POST",
    contentType: "application/json",
    bodyJson: {
      model: "glm-5.3",
      messages: [
        {
          role: "system",
          content:
            "Return fixed diagnostic JSON only. Do not call tools or include user content.",
        },
        {
          role: "user",
          content: JSON.stringify({
            diagnostic: "glm_advanced_brain_acceptance_v1",
          }),
        },
      ],
      stream: false,
      max_tokens: GLM_ADVANCED_BRAIN_ACCEPTANCE_GLM53_MAX_TOKENS,
      thinking: { type: "enabled" },
      do_sample: false,
    },
    credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
    timeoutMs: GLM_ADVANCED_BRAIN_ACCEPTANCE_TIMEOUT_MS,
    maxResponseBytes: 4_000,
  });
}

async function runRealTransportFixture(
  response: Response,
): Promise<ReturnType<GlmAdvancedBrainAcceptanceService["runDiagnostic"]> extends Promise<infer T> ? T : never> {
  const fetchImpl = vi.fn(async (_url: string, _init: RequestInit) => response);
  const transport = new RealGlmAcceptanceTransport(fetchImpl);
  const { service } = await createService({ transport });
  await service.setModel({ modelId: "glm-5.3" });
  await service.saveCredential(fakeCredential());

  const report = await service.runDiagnostic(consent());

  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(report.realNetworkRequestSent).toBe(true);
  expect(report.retryCount).toBe(0);
  expect(report.fallbackCount).toBe(0);
  return report;
}

function glmChatCompletionResponse(
  overrides: {
    readonly choices?: unknown[];
    readonly usage?: Record<string, unknown>;
  } = {},
): Response {
  // Official synthetic response shape references:
  // https://docs.bigmodel.cn/cn/guide/start/concept-param
  // https://docs.bigmodel.cn/cn/guide/capabilities/thinking-mode
  // https://docs.bigmodel.cn/cn/guide/capabilities/struct-output
  return new Response(
    JSON.stringify({
      choices:
        overrides.choices ??
        [
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
      usage:
        overrides.usage ??
        {
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
    requestId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
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
  options: {
    readonly responseByteCount?: number;
    readonly responseJson?: Record<string, unknown>;
  } = {},
): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CURRENT_ID,
    providerId: GLM_ADVANCED_BRAIN_PROVIDER_ID,
    deploymentId: GLM_ADVANCED_BRAIN_DEPLOYMENT_ID,
    operation: GLM_ADVANCED_BRAIN_OPERATION,
    statusClass,
    reasonCode,
    ...(httpStatus ? { httpStatus } : {}),
    ...(options.responseJson ? { responseJson: options.responseJson } : {}),
    safeHeaders: { contentType: "application/json" },
    latencyMs: 10,
    ...(options.responseByteCount !== undefined
      ? { responseByteCount: options.responseByteCount }
      : {}),
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
