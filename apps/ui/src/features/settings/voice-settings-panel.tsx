import { Settings, Volume2 } from "lucide-react";

import type { uiCopy } from "@/app/copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/shared/Metric";

type Copy = (typeof uiCopy)["en"];
type Tone = "success" | "warning" | "accent";

export type VoiceSettingsMetric = {
  label: string;
  value: string;
  tone?: Tone;
};

export type VoiceSettingsViewModel = {
  captureErrorDetail?: string | null;
  captureNotice?: string | null;
  languageMismatch: boolean;
  metrics: VoiceSettingsMetric[];
  permission: string;
  ttsSettingsLabel: string;
  voiceSettingsDisabled: boolean;
};

export type VoiceSettingsActions = {
  openTtsSettings: () => void;
  openVoiceSettings: () => void;
};

export function VoiceSettingsPanel({
  actions,
  copy,
  viewModel,
}: {
  actions: VoiceSettingsActions;
  copy: Copy;
  viewModel: VoiceSettingsViewModel;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{copy.settings.voice}</h3>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {viewModel.permission}
        </Badge>
      </div>
      <dl className="divide-y divide-border border-y text-[11px]">
        {viewModel.metrics.map((item) => (
          <Metric
            key={item.label}
            label={item.label}
            tone={item.tone}
            value={item.value}
          />
        ))}
      </dl>
      {viewModel.languageMismatch && (
        <p
          className="mt-2 text-[11px] leading-4 text-warning"
          data-testid="settings-voice-language-warning"
        >
          {copy.label.voiceLanguageMismatch}
        </p>
      )}
      {viewModel.captureNotice && (
        <p
          className="mt-2 text-[11px] leading-4 text-warning"
          data-testid="settings-voice-capture-notice"
        >
          {viewModel.captureNotice}
        </p>
      )}
      {viewModel.captureErrorDetail && (
        <p
          className="mt-2 text-[11px] leading-4 text-muted-foreground"
          data-testid="settings-voice-capture-error-detail"
        >
          {viewModel.captureErrorDetail}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          data-testid="settings-open-voice-settings"
          disabled={viewModel.voiceSettingsDisabled}
          onClick={actions.openVoiceSettings}
          type="button"
          variant="secondary"
        >
          <Settings className="size-3.5" />
          {copy.settings.voiceSettings}
        </Button>
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          data-testid="settings-open-tts-settings"
          disabled={viewModel.voiceSettingsDisabled}
          onClick={actions.openTtsSettings}
          type="button"
          variant="secondary"
        >
          <Volume2 className="size-3.5" />
          {viewModel.ttsSettingsLabel}
        </Button>
      </div>
    </section>
  );
}
