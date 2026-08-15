import { RefreshCw } from "lucide-react";

import type { uiCopy } from "@/app/copy";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];
type Tone = "success" | "warning" | "accent";

export type ModelGovernanceSettingsMetric = {
  label: string;
  value: string;
  tone?: Tone;
};

export type ModelGovernanceSettingsViewModel = {
  metrics: ModelGovernanceSettingsMetric[];
};

export type ModelGovernanceSettingsActions = {
  refresh: () => void;
};

export function ModelGovernanceSettingsPanel({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: ModelGovernanceSettingsActions;
  copy: Copy;
  sending: boolean;
  viewModel: ModelGovernanceSettingsViewModel;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {copy.settings.modelGovernance}
        </h3>
        <Button
          aria-label="Refresh model governance from settings"
          className="size-8 rounded-md"
          data-testid="settings-refresh-model-governance"
          disabled={sending}
          onClick={actions.refresh}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <RefreshCw className={cn("size-3.5", sending && "animate-spin")} />
        </Button>
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
    </section>
  );
}
