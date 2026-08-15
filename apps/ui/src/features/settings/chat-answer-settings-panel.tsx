import { RefreshCw } from "lucide-react";

import type { uiCopy } from "@/app/copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];
type Tone = "success" | "warning" | "accent";

export type ChatAnswerMetric = {
  label: string;
  value: string;
  tone?: Tone;
};

export type ChatAnswerSettingsViewModel = {
  controlSummary: string;
  headerBadge: string;
  metrics: ChatAnswerMetric[];
  notice: string;
  productModeEnabled: boolean;
};

export type ChatAnswerSettingsActions = {
  refreshProductMode: () => void;
  setProductModeEnabled: (enabled: boolean) => void;
};

export function ChatAnswerSettingsPanel({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: ChatAnswerSettingsActions;
  copy: Copy;
  sending: boolean;
  viewModel: ChatAnswerSettingsViewModel;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{copy.settings.chatAnswer}</h3>
        <div className="flex items-center gap-1.5">
          <Badge
            className="rounded-md text-[10px]"
            variant={viewModel.productModeEnabled ? "default" : "outline"}
          >
            {viewModel.headerBadge}
          </Badge>
          <Button
            aria-label="Refresh Chat Answer product mode"
            className="size-8 rounded-md"
            data-testid="settings-refresh-chat-answer-product-mode"
            disabled={sending}
            onClick={actions.refreshProductMode}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <RefreshCw className={cn("size-3.5", sending && "animate-spin")} />
          </Button>
        </div>
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
      <label className="mt-3 flex items-center justify-between gap-3 border-y py-2 text-[11px]">
        <span className="min-w-0">
          <span className="block font-medium">
            Provider-backed answer control
          </span>
          <span className="mt-0.5 block text-muted-foreground">
            {viewModel.controlSummary}
          </span>
        </span>
        <input
          aria-label="Provider-backed Chat Answer control"
          checked={viewModel.productModeEnabled}
          className="size-4 accent-primary"
          data-testid="settings-chat-answer-product-mode-toggle"
          onChange={(event) =>
            actions.setProductModeEnabled(event.target.checked)
          }
          type="checkbox"
        />
      </label>
      <p
        className="mt-2 text-[11px] leading-4 text-muted-foreground"
        data-testid="settings-chat-answer-product-mode-notice"
      >
        {viewModel.notice}
      </p>
    </section>
  );
}
