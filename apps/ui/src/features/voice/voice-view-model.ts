import type { VoiceServiceStatus } from "@jarvis-k/contracts";

import type {
  VoiceControlCopy,
  VoiceMetric,
  VoiceMetricTone,
} from "./types";

export function selectVoiceServiceLanguage(
  status: VoiceServiceStatus | null,
  copy: VoiceControlCopy,
) {
  return status?.language === "en" ? copy.settings.english : copy.settings.chinese;
}

export function selectVoiceLanguageMismatch(
  uiLanguage: "en" | "zh",
  status: VoiceServiceStatus | null,
) {
  return uiLanguage === "zh" && status?.language === "en";
}

export function formatVoiceAudioPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function buildVoiceDiagnostics(input: {
  active: boolean;
  captureNotice: string | null;
  captureState: string;
  copy: VoiceControlCopy;
  engineState: string;
  framesSent: number;
  mode: string;
  peak: string;
  permission: string;
  rms: string;
  serviceConfigured: boolean;
  serviceLanguage: string;
  sessionId?: string;
  languageMismatch: boolean;
}): VoiceMetric[] {
  return [
    {
      label: input.copy.label.voiceService,
      value: input.serviceConfigured
        ? input.copy.label.voiceServiceConfigured
        : input.copy.label.voiceServiceMissing,
      tone: input.serviceConfigured ? "success" : "warning",
    },
    {
      label: input.copy.label.voiceRecognitionLanguage,
      value: input.serviceLanguage,
      tone: input.languageMismatch ? "warning" : undefined,
    },
    {
      label: input.copy.metric.micCapture,
      value: input.captureState,
      tone: selectMicCaptureTone(input.active, input.captureNotice),
    },
    {
      label: input.copy.metric.voiceEngine,
      value: input.engineState,
      tone: "warning",
    },
    {
      label: input.copy.metric.voiceMode,
      value: input.mode,
    },
    {
      label: input.copy.metric.micPermission,
      value: input.permission,
    },
    {
      label: input.copy.metric.voiceFrames,
      value: String(input.framesSent),
    },
    {
      label: input.copy.metric.voiceRms,
      value: input.rms,
    },
    {
      label: input.copy.metric.voicePeak,
      value: input.peak,
    },
    {
      label: input.copy.metric.session,
      value: input.sessionId?.slice(-12) ?? "idle",
    },
  ];
}

function selectMicCaptureTone(
  active: boolean,
  captureNotice: string | null,
): VoiceMetricTone | undefined {
  if (active) return "success";
  if (captureNotice) return "warning";
  return undefined;
}
