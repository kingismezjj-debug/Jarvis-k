import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Metric } from "@/components/shared/Metric";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type {
  VoiceCaptureActions,
  VoiceControlCopy,
  VoiceStatusViewModel,
} from "./types";

export type VoiceStatusProps = {
  actions: Pick<VoiceCaptureActions, "openSettings">;
  copy: VoiceControlCopy;
  viewModel: VoiceStatusViewModel;
};

export function VoiceStatus({ actions, copy, viewModel }: VoiceStatusProps) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{copy.label.diagnostics}</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Open voice settings from voice view"
              className="size-8 rounded-md"
              data-testid="voice-view-settings"
              disabled={viewModel.settingsDisabled}
              onClick={actions.openSettings}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Settings className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Voice service settings</TooltipContent>
        </Tooltip>
      </div>
      <dl className="divide-y divide-border border-y text-[11px]">
        {viewModel.metrics.map((metric) => (
          <Metric
            key={`${metric.label}-${metric.value}`}
            label={metric.label}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </dl>
    </section>
  );
}
