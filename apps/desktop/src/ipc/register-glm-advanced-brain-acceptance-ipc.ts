import type { BrowserWindow, IpcMain, IpcMainInvokeEvent } from "electron";
import {
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
  GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
  GlmAdvancedBrainAcceptanceConsentRequestSchema,
  GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema,
  GlmAdvancedBrainAcceptanceSetModelRequestSchema,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_DIAGNOSTIC_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_MODEL_SET_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_STATUS_CHANNEL,
} from "@jarvis-k/contracts";
import type { GlmAdvancedBrainAcceptanceService } from "../glm-advanced-brain-acceptance/glm-advanced-brain-acceptance-service";

const CHANNELS = [
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_STATUS_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_MODEL_SET_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_CHANNEL,
  IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_DIAGNOSTIC_CHANNEL,
] as const;

export function registerGlmAdvancedBrainAcceptanceIpc(options: {
  ipcMain: Pick<IpcMain, "handle" | "removeHandler">;
  getMainWindow: () => BrowserWindow | null;
  service: GlmAdvancedBrainAcceptanceService;
}): () => void {
  unregisterGlmAdvancedBrainAcceptanceIpc(options.ipcMain);
  const isMainWindowSender = (event: IpcMainInvokeEvent) => {
    const mainWindow = options.getMainWindow();
    return Boolean(mainWindow && event.sender === mainWindow.webContents);
  };

  options.ipcMain.handle(
    IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_STATUS_CHANNEL,
    (event) => {
      if (!isMainWindowSender(event)) {
        return unavailableStatus();
      }
      return options.service.getStatus();
    },
  );
  options.ipcMain.handle(
    IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_MODEL_SET_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return rejectedCommandResult();
      }
      return options.service.setModel(
        GlmAdvancedBrainAcceptanceSetModelRequestSchema.parse(rawInput),
      );
    },
  );
  options.ipcMain.handle(
    IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_SAVE_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return rejectedCommandResult();
      }
      return options.service.saveCredential(
        GlmAdvancedBrainAcceptanceSaveCredentialRequestSchema.parse(rawInput),
      );
    },
  );
  options.ipcMain.handle(
    IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_DELETE_CHANNEL,
    (event) => {
      if (!isMainWindowSender(event)) {
        return rejectedCommandResult();
      }
      return options.service.deleteCredential();
    },
  );
  options.ipcMain.handle(
    IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_PREFLIGHT_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        return rejectedPreflight();
      }
      return options.service.preflight(
        GlmAdvancedBrainAcceptanceConsentRequestSchema.parse(rawInput),
      );
    },
  );
  options.ipcMain.handle(
    IPC_GLM_ADVANCED_BRAIN_ACCEPTANCE_DIAGNOSTIC_CHANNEL,
    (event, rawInput) => {
      if (!isMainWindowSender(event)) {
        throw new Error("GLM_ADVANCED_BRAIN_ACCEPTANCE_UNAVAILABLE");
      }
      return options.service.runDiagnostic(
        GlmAdvancedBrainAcceptanceConsentRequestSchema.parse(rawInput),
      );
    },
  );

  return () => unregisterGlmAdvancedBrainAcceptanceIpc(options.ipcMain);
}

export function unregisterGlmAdvancedBrainAcceptanceIpc(
  ipcMain: Pick<IpcMain, "removeHandler">,
): void {
  for (const channel of CHANNELS) {
    ipcMain.removeHandler(channel);
  }
}

function unavailableStatus() {
  return {
    providerId: "advanced-brain.glm",
    providerEnabled: false,
    acceptanceFlagEnabled: false,
    modelExplicitlySelected: false,
    credentialConfigured: false,
    secureStorageAvailable: false,
    credentialStorageEncrypted: false,
    credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
    endpointProfileId: "standard_paas_v4",
    endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
    operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
    fullEndpointMatch: true,
    officialEndpointProfile: true,
    credentialExposed: false,
    promptExposed: false,
    rawResponseExposed: false,
    rendererWritableTrustedGates: false,
    reasonCodes: ["provider_disabled", "acceptance_flag_missing"],
  };
}

function rejectedCommandResult() {
  return {
    ok: false,
    status: unavailableStatus(),
    safeMessage: "GLM Advanced Brain acceptance is unavailable.",
  };
}

function rejectedPreflight() {
  return {
    allowRealAcceptance: false,
    providerId: "advanced-brain.glm",
    endpointProfileId: "standard_paas_v4",
    endpointOrigin: GLM_ADVANCED_BRAIN_ACCEPTANCE_ORIGIN,
    operationPath: GLM_ADVANCED_BRAIN_ACCEPTANCE_OPERATION_PATH,
    fullEndpointMatch: true,
    credentialBindingId: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_BINDING_ID,
    credentialConfigured: false,
    credentialStorageEncrypted: false,
    credentialTypeConfirmed: GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE,
    selectedModelExplicit: false,
    checkedAt: new Date().toISOString(),
    reasonCodes: ["provider_disabled"],
    cloudRequestFixed: true,
    requestBodyFixed: true,
    userContentIncluded: false,
    fileIncluded: false,
    imageIncluded: false,
    maximumOutputTokens: 64,
    maxOutputTokens: 64,
    boundedTimeoutMs: 2000,
    streaming: false,
    toolsEnabled: false,
    retryEnabled: false,
    fallbackEnabled: false,
    executorReachable: false,
    allowSingleRealAcceptance: false,
    automaticRetry: false,
    automaticFallback: false,
    toolCapabilityCount: 0,
    windowsExecutorAllowed: false,
    pluginRuntimeAllowed: false,
    directActionAttempted: false,
    realNetworkRequestSent: false,
    credentialExposed: false,
    promptExposed: false,
    rawResponseExposed: false,
  };
}
