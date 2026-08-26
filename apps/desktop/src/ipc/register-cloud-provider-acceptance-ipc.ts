import type { BrowserWindow, IpcMain, IpcMainInvokeEvent } from "electron";
import {
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
  CloudProviderAcceptanceConsentRequestSchema,
  CloudProviderAcceptanceDeleteCredentialRequestSchema,
  CloudProviderAcceptanceSaveCredentialRequestSchema,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_FAKE_RUN_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_REAL_RUN_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import type { CloudProviderAcceptanceService } from "../cloud-provider-acceptance/cloud-provider-acceptance-service";

const CHANNELS = [
  IPC_CLOUD_PROVIDER_ACCEPTANCE_STATUS_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_FAKE_RUN_CHANNEL,
  IPC_CLOUD_PROVIDER_ACCEPTANCE_REAL_RUN_CHANNEL,
] as const;

export function registerCloudProviderAcceptanceIpc(options: {
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  getMainWindow: () => BrowserWindow | null;
  service: CloudProviderAcceptanceService;
}): () => void {
  unregisterCloudProviderAcceptanceIpc(options.ipcMain);
  const isMainWindowSender = (event: IpcMainInvokeEvent) => {
    const mainWindow = options.getMainWindow();
    return Boolean(mainWindow && event.sender === mainWindow.webContents);
  };

  options.ipcMain.handle(
    IPC_CLOUD_PROVIDER_ACCEPTANCE_STATUS_CHANNEL,
    (event) => {
      if (!isMainWindowSender(event)) {
        return unavailableStatus();
      }
      return options.service.getStatus();
    },
  );
  options.ipcMain.handle(
    IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return rejectedCommandResult();
      }
      return options.service.saveCredential(
        CloudProviderAcceptanceSaveCredentialRequestSchema.parse(rawInput),
      );
    },
  );
  options.ipcMain.handle(
    IPC_CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return rejectedCommandResult();
      }
      return options.service.deleteCredential(
        CloudProviderAcceptanceDeleteCredentialRequestSchema.parse(rawInput),
      );
    },
  );
  options.ipcMain.handle(
    IPC_CLOUD_PROVIDER_ACCEPTANCE_PREFLIGHT_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return rejectedPreflight();
      }
      return options.service.preflight(
        CloudProviderAcceptanceConsentRequestSchema.parse(rawInput),
      );
    },
  );
  options.ipcMain.handle(
    IPC_CLOUD_PROVIDER_ACCEPTANCE_FAKE_RUN_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        throw new Error("CLOUD_PROVIDER_ACCEPTANCE_UNAVAILABLE");
      }
      return options.service.runFakeAcceptance(
        CloudProviderAcceptanceConsentRequestSchema.parse(rawInput),
      );
    },
  );
  options.ipcMain.handle(
    IPC_CLOUD_PROVIDER_ACCEPTANCE_REAL_RUN_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        throw new Error("CLOUD_PROVIDER_ACCEPTANCE_UNAVAILABLE");
      }
      return options.service.runRealAcceptance(
        CloudProviderAcceptanceConsentRequestSchema.parse(rawInput),
      );
    },
  );

  return () => unregisterCloudProviderAcceptanceIpc(options.ipcMain);
}

export function unregisterCloudProviderAcceptanceIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  for (const channel of CHANNELS) {
    ipcMain.removeHandler(channel);
  }
}

function unavailableStatus() {
  return {
    schemaVersion: 1,
    capabilityFlagEnabled: false,
    source: "desktop-main",
    productRoutingEnabled: false,
    realRunCapabilityEnabled: false,
    realAcceptanceCapabilityEnabled: false,
    fakeAcceptanceCapabilityEnabled: false,
    releaseChannel: "development",
    secureStorageAvailable: false,
    profiles: [
      {
        schemaVersion: 1,
        acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
        acceptanceVersion: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
        providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
        modelId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
        endpointProfileId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
        endpointOrigin: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
        operationPath: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
        credentialBindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        protocolFamily: "openai_chat_completions",
        requestContractId:
          CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
        fixedPromptId: "cloud-provider-acceptance-fixed-diagnostic-v1",
        stream: true,
        streamUsageIncluded: true,
        thinkingType: "disabled",
        reasoningEffortPresent: false,
        maxTokens: 512,
        responseFormatPresent: false,
        toolsEnabled: false,
        retryEnabled: false,
        fallbackEnabled: false,
        timeoutPolicy: {
          policyId: "deepseek-acceptance-stream-v1",
          headersMs: 15000,
          firstEventMs: 60000,
          idleMs: 30000,
          overallMs: 180000,
        },
        expectedOutputSchemaId: "fixed-cloud-diagnostic-v1",
        enabledByReleaseGate: false,
        pricingTier: "low",
      },
    ],
    credentialBindings: [
      {
        schemaVersion: 1,
        credentialBindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
        credentialType: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
        displayName: "DeepSeek Advanced Brain API key",
        storageScope: "desktop_main_user_data",
        releaseChannelScope: "development",
        allowedProtocolFamilies: ["openai_chat_completions"],
        cloudProvider: true,
        userConfirmationRequired: true,
        enabledForProduct: false,
      },
    ],
    credentialStatuses: [
      {
        bindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
        providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
        credentialType: CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
        configured: false,
        encrypted: false,
        secureStorageAvailable: false,
        status: "unavailable",
        credentialExposed: false,
      },
    ],
    ledger: {
      acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
      acceptanceVersion: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
      providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
      modelId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
      state: "blocked",
      consumed: false,
      requestCount: 0,
      sanitizedResultCategory: "not_run",
    },
    credentialExposed: false,
    promptExposed: false,
    rawResponseExposed: false,
    rendererWritableTrustedGates: false,
  };
}

function rejectedCommandResult() {
  return {
    ok: false,
    status: unavailableStatus(),
    safeMessage: "Cloud provider acceptance is unavailable.",
  };
}

function rejectedPreflight() {
  return {
    schemaVersion: 1,
    acceptanceId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
    acceptanceVersion: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_VERSION,
    acceptanceState: "blocked",
    providerId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_PROVIDER_ID,
    modelId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_MODEL_ID,
    endpointProfileId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ENDPOINT_PROFILE_ID,
    endpointOrigin: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_ORIGIN,
    operationPath: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_OPERATION_PATH,
    httpMethod: "POST",
    redirectPolicy: "none",
    fullEndpointMatch: true,
    credentialBindingId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
    credentialConfigured: false,
    credentialStorageEncrypted: false,
    secureStorageAvailable: false,
    providerKeyTypeConfirmed: false,
    apiBalanceConfirmedByUser: false,
    protocolFamily: "openai_chat_completions",
    requestContractId: CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_REQUEST_CONTRACT_ID,
    fixedInput: true,
    userContentIncluded: false,
    stream: true,
    streamUsageIncluded: true,
    includeUsage: true,
    thinkingType: "disabled",
    reasoningEffortPresent: false,
    reasoningEffort: "absent",
    maxTokens: 512,
    timeoutHeadersMs: 15000,
    timeoutFirstEventMs: 60000,
    timeoutIdleMs: 30000,
    timeoutOverallMs: 180000,
    timeoutBounded: true,
    toolsEnabled: false,
    retryEnabled: false,
    fallbackEnabled: false,
    executorReachable: false,
    productRoutingEnabled: false,
    cloudEgressConfirmed: false,
    realAcceptanceCapability: false,
    pricingTier: "low",
    priorRequestCount: 0,
    consumed: false,
    allowSingleRealAcceptance: false,
    allowFakeAcceptance: false,
    realNetworkRequestSent: false,
    reasonCodes: ["provider_disabled"],
    credentialExposed: false,
    promptExposed: false,
    rawResponseExposed: false,
  };
}
