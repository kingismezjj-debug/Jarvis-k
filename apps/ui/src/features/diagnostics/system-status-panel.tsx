import { RefreshCw } from "lucide-react";
import type { CoreSnapshot } from "@jarvis-k/contracts";

import type { uiCopy } from "@/app/copy";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];

export type SystemStatusViewModel = {
  accelerationBackends: string;
  connection: string;
  gpuCount: number;
  memoryAlphaState?: string;
  runtimeMode: string;
  snapshot: CoreSnapshot | null;
  voicePeak: string;
  voiceRms: string;
  voiceFramesSent: number;
};

export type SystemStatusActions = {
  probeCore(): void;
};

export function SystemStatusPanel({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: SystemStatusActions;
  copy: Copy;
  sending: boolean;
  viewModel: SystemStatusViewModel;
}) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            {copy.label.runtimeActivity}
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {copy.label.runtimeActivitySubtitle}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Probe Core"
              className="rounded-md"
              onClick={actions.probeCore}
              size="icon-sm"
              variant="ghost"
            >
              <RefreshCw
                className={cn("size-3.5", sending && "animate-spin")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Probe Core</TooltipContent>
        </Tooltip>
      </div>

      <Separator className="my-4" />

      <dl className="shrink-0 divide-y divide-border border-y text-[11px]">
        <Metric
          label={copy.metric.coreHealth}
          tone="success"
          value={viewModel.snapshot?.health ?? viewModel.connection}
        />
        <Metric
          label={copy.metric.runtimeMode}
          tone="accent"
          value={viewModel.runtimeMode}
        />
        <Metric
          label={copy.metric.memory}
          tone={
            viewModel.snapshot?.memoryHealth?.status === "degraded"
              ? "warning"
              : "success"
          }
          value={viewModel.snapshot?.memoryHealth?.status ?? "unknown"}
        />
        <Metric
          label={copy.metric.memoryAlpha}
          tone={
            viewModel.memoryAlphaState === "active"
              ? "success"
              : viewModel.memoryAlphaState === "degraded"
                ? "warning"
                : undefined
          }
          value={viewModel.memoryAlphaState ?? "unknown"}
        />
        <Metric label={copy.metric.gpuCount} value={String(viewModel.gpuCount)} />
        <Metric
          label={copy.metric.acceleration}
          value={viewModel.accelerationBackends}
        />
        <Metric
          label={copy.metric.voiceEngine}
          tone="warning"
          value={viewModel.snapshot?.voice.state ?? "disabled"}
        />
        <Metric
          label={copy.metric.micPermission}
          value={viewModel.snapshot?.voice.permission ?? "unknown"}
        />
        <Metric
          label={copy.metric.voiceFrames}
          value={String(viewModel.voiceFramesSent)}
        />
        <Metric label={copy.metric.voiceRms} value={viewModel.voiceRms} />
        <Metric label={copy.metric.voicePeak} value={viewModel.voicePeak} />
        <Metric label={copy.metric.transport} tone="accent" value="IPC" />
        <Metric
          label={copy.metric.sequence}
          value={String(viewModel.snapshot?.sequenceId ?? 0).padStart(4, "0")}
        />
      </dl>
    </>
  );
}
