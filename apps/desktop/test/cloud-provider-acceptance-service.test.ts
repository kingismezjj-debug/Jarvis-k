import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { BrowserWindow } from "electron";
import { afterEach, describe, expect, it } from "vitest";
import type {
  CloudReasoningTransportResult,
  CloudReasoningTransportRequest,
} from "@jarvis-k/contracts";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
  CloudReasoningTransportResultSchema,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import type { CloudReasoningTransportSendOptions } from "@jarvis-k/capabilities";
import { CloudProviderAcceptanceLedger } from "../src/cloud-provider-acceptance/cloud-provider-acceptance-ledger";
import {
  CloudProviderAcceptanceService,
  type CloudProviderAcceptanceTransport,
} from "../src/cloud-provider-acceptance/cloud-provider-acceptance-service";
import { CloudProviderAcceptanceProfileRegistry } from "../src/cloud-provider-acceptance/cloud-provider-acceptance-profile-registry";
import { CloudProviderCredentialBroker } from "../src/cloud-provider-acceptance/cloud-provider-credential-broker";
import { CloudProviderCredentialVault } from "../src/cloud-provider-acceptance/cloud-provider-credential-vault";
import { CloudProviderCredentialBindingRegistry } from "../src/cloud-provider-acceptance/credential-binding-registry";
import { registerCloudProviderAcceptanceIpc } from "../src/ipc/register-cloud-provider-acceptance-ipc";
import type { SecureStringEncryption } from "../src/secure-voice-provider-store";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("CloudProviderAcceptanceService", () => {
  it("is disabled and hidden without the cloud acceptance capability flag", async () => {
    const { service } = await createService({ capabilityFlagEnabled: false });

    const status = await service.getStatus();
    const preflight = await service.preflight(consent());

    expect(status).toMatchObject({
      capabilityFlagEnabled: false,
      productRoutingEnabled: false,
      realRunCapabilityEnabled: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
      rendererWritableTrustedGates: false,
    });
    expect(preflight).toMatchObject({
      allowFakeAcceptance: false,
      allowSingleRealAcceptance: false,
      realNetworkRequestSent: false,
      reasonCodes: expect.arrayContaining([
        "capability_flag_missing",
        "provider_disabled",
      ]),
    });
  });

  it("encrypts a provider-neutral credential without migrating GLM history", async () => {
    const { credentialDirectory, rootDirectory, service } = await createService();
    await writeFile(
      path.join(rootDirectory, "jarvis-k-glm-advanced-brain-acceptance-credential.json"),
      JSON.stringify({ configured: true, encrypted: "legacy-glm" }),
      "utf8",
    );

    const result = await service.saveCredential({
      bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
      credentialTypeConfirmation: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
      credential: fakeSecret(),
    });

    expect(result.ok).toBe(true);
    const credentialFile = await readFile(
      path.join(
        credentialDirectory,
        `${CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID}.json`,
      ),
      "utf8",
    );
    expect(credentialFile).not.toContain(fakeSecret());
    expect(credentialFile).not.toContain("Authorization");
    expect(credentialFile).not.toContain("Bearer");
    expect(result.status.credentialStatuses).toContainEqual(
      expect.objectContaining({
        bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        configured: true,
        encrypted: true,
        credentialExposed: false,
      }),
    );
  });

  it("runs the fixed DeepSeek fake acceptance through broker, runtime, parser, and ledger", async () => {
    const transport = new RecordingTransport(successSse());
    const { broker, ledgerPath, service } = await createService({ transport });
    await service.saveCredential(saveCredentialRequest());

    const preflight = await service.preflight(consent());
    expect(preflight).toMatchObject({
      acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
      providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
      modelId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
      endpointOrigin: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
      operationPath: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
      fullEndpointMatch: true,
      fixedInput: true,
      stream: true,
      streamUsageIncluded: true,
      thinkingType: "disabled",
      reasoningEffortPresent: false,
      maxTokens: 512,
      toolsEnabled: false,
      retryEnabled: false,
      fallbackEnabled: false,
      executorReachable: false,
      productRoutingEnabled: false,
      allowFakeAcceptance: true,
      allowSingleRealAcceptance: false,
      realNetworkRequestSent: false,
      reasonCodes: ["ready"],
    });

    const report = await service.runFakeAcceptance(consent());

    expect(transport.calls).toHaveLength(1);
    expect(broker.useCount).toBe(1);
    expect(transport.calls[0]?.credentialValue).toBe(fakeSecret());
    expect(transport.calls[0]?.request.bodyJson).toMatchObject({
      model: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: 512,
      thinking: { type: "disabled" },
    });
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "reasoning_effort",
    );
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty(
      "response_format",
    );
    expect(transport.calls[0]?.request.bodyJson).not.toHaveProperty("tools");
    expect(report).toMatchObject({
      acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
      requestContractId:
        CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
      endpointProfileId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
      requestSent: true,
      responseCompleted: true,
      structuredResultValidation: "PASS",
      sanitizedResultCategory: "fixed_diagnostic_ok",
      retryCount: 0,
      fallbackCount: 0,
      toolCallCount: 0,
      directActionAttempted: false,
      executorInvocationDelta: 0,
      acceptanceConsumed: true,
      realNetworkRequestSent: false,
      rawSsePersisted: false,
      credentialExposed: false,
      promptExposed: false,
      rawResponseExposed: false,
    });
    expect(await readFile(ledgerPath, "utf8")).not.toContain(fakeSecret());
    await expect(service.preflight(consent())).resolves.toMatchObject({
      consumed: true,
      priorRequestCount: 1,
      allowFakeAcceptance: false,
      reasonCodes: ["acceptance_already_consumed"],
    });
  });

  it("consumes before transport and prevents concurrent double invocation", async () => {
    const transport = new RecordingTransport(successSse(), { hold: true });
    const { service } = await createService({ transport });
    await service.saveCredential(saveCredentialRequest());

    const first = service.runFakeAcceptance(consent());
    const second = service.runFakeAcceptance(consent()).catch((error: unknown) => error);
    await transport.release();
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toMatchObject({ acceptanceConsumed: true });
    expect(secondResult).toBeInstanceOf(Error);
    expect(transport.calls).toHaveLength(1);
    await expect(service.preflight(consent())).resolves.toMatchObject({
      consumed: true,
      priorRequestCount: 1,
      allowFakeAcceptance: false,
    });
  });

  it("does not reset consumed ledger state when a credential is deleted", async () => {
    const { service } = await createService({
      transport: new RecordingTransport(successSse()),
    });
    await service.saveCredential(saveCredentialRequest());
    await service.runFakeAcceptance(consent());

    await service.deleteCredential({
      bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
    });

    const status = await service.getStatus();
    expect(status.ledger).toMatchObject({
      consumed: true,
      requestCount: 1,
    });
    expect(status.credentialStatuses).toContainEqual(
      expect.objectContaining({
        bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        configured: false,
      }),
    );
  });

  it("reports sanitized provider and transport failures without retry or fallback", async () => {
    const cases = [
      { statusClass: "auth_failure", reasonCode: "credential_rejected", httpStatus: 401 },
      { statusClass: "rate_limited", reasonCode: "rate_limited", httpStatus: 429 },
      { statusClass: "timeout", reasonCode: "overall_timeout" },
      {
        statusClass: "invalid_response",
        reasonCode: "untrusted_tool_proposal_blocked",
        httpStatus: 200,
      },
    ] as const;

    for (const item of cases) {
      const transport = new RecordingTransport(
        transportResult({
          statusClass: item.statusClass,
          reasonCode: item.reasonCode,
          httpStatus: item.httpStatus,
          requestSent: true,
          responseStarted: item.statusClass !== "timeout",
          responseCompleted: item.statusClass !== "timeout",
        }),
      );
      const { service } = await createService({ transport });
      await service.saveCredential(saveCredentialRequest());
      const report = await service.runFakeAcceptance(consent());
      expect(report).toMatchObject({
        structuredResultValidation: "FAIL",
        sanitizedResultCategory: item.reasonCode,
        retryCount: 0,
        fallbackCount: 0,
        realNetworkRequestSent: false,
        credentialExposed: false,
        rawResponseExposed: false,
      });
      expect(transport.calls).toHaveLength(1);
    }
  });

  it("allows only the main window sender to access cloud acceptance IPC", async () => {
    const { service } = await createService();
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const ipcMain = {
      handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      },
      removeHandler: (channel: string) => {
        handlers.delete(channel);
      },
    };
    const mainSender = {};
    const dispose = registerCloudProviderAcceptanceIpc({
      ipcMain,
      getMainWindow: () =>
        ({ webContents: mainSender }) as unknown as BrowserWindow,
      service,
    });

    const blockedStatus = await handlers.get(
      IPC_CLOUD_PROVIDER_ACCEPTANCE_STATUS_CHANNEL,
    )?.({ sender: {} });
    expect(blockedStatus).toMatchObject({
      capabilityFlagEnabled: false,
      rendererWritableTrustedGates: false,
    });

    const mainPreflight = await handlers.get(
      IPC_CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_CHANNEL,
    )?.({ sender: mainSender }, consent());
    expect(mainPreflight).toMatchObject({
      acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
      realNetworkRequestSent: false,
    });

    dispose();
    expect(handlers.size).toBe(0);
  });
});

function saveCredentialRequest() {
  return {
    bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
    credentialTypeConfirmation: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
    credential: fakeSecret(),
  };
}

function consent() {
  return {
    acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
    cloudEgressAllowed: true,
    acceptanceConsent: true,
  };
}

function fakeSecret(): string {
  return "placeholder-cloud-provider-secret";
}

async function createService(input: {
  readonly capabilityFlagEnabled?: boolean;
  readonly transport?: CloudProviderAcceptanceTransport;
} = {}) {
  const rootDirectory = await mkdtemp(
    path.join(os.tmpdir(), "jarvis-cloud-acceptance-"),
  );
  temporaryDirectories.push(rootDirectory);
  const bindingRegistry = new CloudProviderCredentialBindingRegistry({
    releaseChannel: "test",
  });
  const credentialDirectory = path.join(rootDirectory, "credentials");
  const credentialVault = new CloudProviderCredentialVault({
    rootDirectory: credentialDirectory,
    encryption: fakeEncryption(),
    bindingRegistry,
  });
  const broker = new CountingBroker(credentialVault);
  const profileRegistry = new CloudProviderAcceptanceProfileRegistry({
    enabledByReleaseGate: input.capabilityFlagEnabled ?? true,
  });
  const ledgerPath = path.join(rootDirectory, "ledger.json");
  const ledger = new CloudProviderAcceptanceLedger({ ledgerPath });
  const service = new CloudProviderAcceptanceService({
    bindingRegistry,
    credentialVault,
    credentialBroker: broker,
    profileRegistry,
    ledger,
    capabilityFlagEnabled: input.capabilityFlagEnabled ?? true,
    realRunCapabilityEnabled: false,
    transport: input.transport,
  });
  return { broker, credentialDirectory, ledgerPath, rootDirectory, service };
}

function fakeEncryption(): SecureStringEncryption {
  return {
    isAvailable: () => true,
    encrypt: (value: string) =>
      Buffer.from(`encrypted:${Buffer.from(value, "utf8").toString("base64")}`),
    decrypt: (value: Buffer) => {
      const encoded = value.toString("utf8");
      if (!encoded.startsWith("encrypted:")) {
        throw new Error("decrypt failed");
      }
      return Buffer.from(encoded.slice("encrypted:".length), "base64").toString(
        "utf8",
      );
    },
  };
}

class CountingBroker extends CloudProviderCredentialBroker {
  public useCount = 0;

  public async withCredential<T>(
    bindingId: typeof CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
    operation: (credential: { readonly scheme: "bearer"; readonly value: string }) => Promise<T>,
  ): Promise<T> {
    this.useCount += 1;
    return super.withCredential(bindingId, operation);
  }
}

class RecordingTransport implements CloudProviderAcceptanceTransport {
  public readonly calls: Array<{
    readonly credentialValue: string | undefined;
    readonly request: CloudReasoningTransportRequest;
  }> = [];
  private releasePromise: Promise<void> | null = null;
  private releaseHold: (() => void) | null = null;

  public constructor(
    private readonly result: CloudReasoningTransportResult,
    options: { readonly hold?: boolean } = {},
  ) {
    if (options.hold) {
      this.releasePromise = new Promise((resolve) => {
        this.releaseHold = resolve;
      });
    }
  }

  public async send(
    request: CloudReasoningTransportRequest,
    options: CloudReasoningTransportSendOptions,
  ): Promise<CloudReasoningTransportResult> {
    this.calls.push({
      credentialValue: options.credential?.value,
      request,
    });
    await this.releasePromise;
    return {
      ...this.result,
      requestId: request.requestId,
      providerId: request.providerId,
      deploymentId: request.deploymentId,
      operation: request.operation,
    };
  }

  public async release(): Promise<void> {
    this.releaseHold?.();
    await Promise.resolve();
  }
}

function successSse(): CloudReasoningTransportResult {
  const finalContent = JSON.stringify({
    diagnostic: "ok",
    directActionAttempted: false,
    toolCallCount: 0,
  });
  const sseText = [
    `data: ${JSON.stringify({
      choices: [{ delta: { content: finalContent }, finish_reason: null }],
    })}`,
    "",
    `data: ${JSON.stringify({
      choices: [{ delta: {}, finish_reason: "stop" }],
      usage: {
        prompt_tokens: 8,
        completion_tokens: 10,
        total_tokens: 18,
      },
    })}`,
    "",
    "data: [DONE]",
    "",
  ].join("\n");
  return transportResult({
    statusClass: "success",
    reasonCode: "completed",
    httpStatus: 200,
    requestSent: true,
    responseStarted: true,
    responseCompleted: true,
    responseJson: { sseText },
    safeHeaders: { contentType: "text/event-stream" },
    responseByteCount: new TextEncoder().encode(sseText).byteLength,
  });
}

function transportResult(
  input: Partial<CloudReasoningTransportResult> & {
    readonly reasonCode: CloudReasoningTransportResult["reasonCode"];
    readonly statusClass: CloudReasoningTransportResult["statusClass"];
  },
): CloudReasoningTransportResult {
  return CloudReasoningTransportResultSchema.parse({
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
    providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
    deploymentId: "deepseek-openai-chat-completions-v1",
    operation: "chat.completions",
    httpStatus: input.httpStatus,
    responseJson: {},
    safeHeaders: {},
    latencyMs: 1,
    responseByteCount: 0,
    requestSent: false,
    responseStarted: false,
    responseCompleted: false,
    cancelled: false,
    timeout: input.statusClass === "timeout",
    automaticRetry: false,
    automaticFallback: false,
    credentialExposed: false,
    requestBodyExposed: false,
    responseBodyLogged: false,
    ...input,
  });
}
