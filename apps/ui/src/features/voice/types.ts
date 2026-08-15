import type {
  UserRouteAliasRecord,
  VoiceCommandAliasRecord,
} from "@jarvis-k/contracts";

import type { uiCopy } from "@/app/copy";

export type VoiceControlCopy = (typeof uiCopy)["en"];
export type VoiceMetricTone = "success" | "warning" | "accent";

export type VoiceMetric = {
  label: string;
  tone?: VoiceMetricTone;
  value: string;
};

export type VoiceCaptureViewModel = {
  active: boolean;
  captureErrorDetail: string | null;
  captureNotice: string | null;
  coreOnline: boolean;
  languageMismatch: boolean;
  mode: string;
  permission: string;
  state: string;
  textOnlyAcceptanceMode: boolean;
  transcript: string;
};

export type VoiceAliasViewModel = {
  routeAliases: UserRouteAliasRecord[];
  voiceAliases: VoiceCommandAliasRecord[];
};

export type VoiceStatusViewModel = {
  metrics: VoiceMetric[];
  settingsDisabled: boolean;
};

export type VoiceControlViewModel = {
  aliases: VoiceAliasViewModel;
  capture: VoiceCaptureViewModel;
  copy: VoiceControlCopy;
  sending: boolean;
  status: VoiceStatusViewModel;
};

export type VoiceCaptureActions = {
  openSettings(): void;
  refreshRouteAliases(): void;
  refreshVoiceAliases(): void;
  removeRouteAlias(aliasId: string): void;
  removeVoiceAlias(aliasId: string): void;
  startCapture(): void;
  stopCapture(reason: "release" | "user-cancel"): void;
};
