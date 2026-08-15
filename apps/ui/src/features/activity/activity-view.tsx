import type { EventEnvelope, MemoryAlphaRecallFailureClass } from "@jarvis-k/contracts";
import { Activity, RefreshCw, X } from "lucide-react";

import type { uiCopy } from "@/app/copy";
import { eventLabel, formatEventTime } from "@/app/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];

export type ActivityViewModel = {
  memoryAlpha: {
    draft: string;
    failureClass?: MemoryAlphaRecallFailureClass;
    maxMessageCount: number;
    probeSummary: string;
    reason: string;
    rollbackStatus: string;
    state: string;
    trackedMessageCount: number;
  };
  recentEvents: EventEnvelope[];
};

export type ActivityViewActions = {
  disableMemoryAlpha: () => void;
  probeCore: () => void;
  refreshMemoryAlpha: () => void;
  runMemoryAlphaProbe: () => void;
  setMemoryAlphaProbeDraft: (value: string) => void;
};

export function ActivityView({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: ActivityViewActions;
  copy: Copy;
  sending: boolean;
  viewModel: ActivityViewModel;
}) {
  return (
    <div
      className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]"
      data-testid="activity-view"
    >
      <section className="min-w-0" data-testid="activity-memory-alpha-spine">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{copy.settings.memoryAlpha}</h3>
          <div className="flex items-center gap-1.5">
            <Button
              aria-label="Disable Memory alpha from activity"
              className="size-8 rounded-md"
              disabled={sending}
              onClick={actions.disableMemoryAlpha}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-3.5" />
            </Button>
            <Button
              aria-label="Refresh Memory alpha from activity"
              className="size-8 rounded-md"
              disabled={sending}
              onClick={actions.refreshMemoryAlpha}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <RefreshCw
                className={cn("size-3.5", sending && "animate-spin")}
              />
            </Button>
          </div>
        </div>
        <dl className="divide-y divide-border border-y text-[11px]">
          <Metric
            label={copy.metric.alphaState}
            value={viewModel.memoryAlpha.state}
          />
          <Metric
            label={copy.metric.tracked}
            value={`${viewModel.memoryAlpha.trackedMessageCount}/${viewModel.memoryAlpha.maxMessageCount}`}
          />
          <Metric
            label={copy.metric.rollback}
            value={viewModel.memoryAlpha.rollbackStatus}
          />
          <Metric label={copy.metric.reason} value={viewModel.memoryAlpha.reason} />
          <Metric
            label={copy.metric.probe}
            value={viewModel.memoryAlpha.probeSummary}
          />
          <Metric
            label={copy.metric.failure}
            value={viewModel.memoryAlpha.failureClass ?? "none"}
          />
        </dl>
        <div className="mt-3 flex items-center gap-2">
          <Input
            aria-label="Activity Memory alpha recall probe"
            className="h-8 rounded-md bg-input/45 px-2.5 text-xs"
            data-testid="activity-memory-alpha-probe-input"
            onChange={(event) =>
              actions.setMemoryAlphaProbeDraft(event.target.value)
            }
            placeholder={copy.label.recallProbePlaceholder}
            value={viewModel.memoryAlpha.draft}
          />
          <Button
            aria-label="Run activity Memory alpha recall probe"
            className="size-8 rounded-md"
            disabled={sending}
            onClick={actions.runMemoryAlphaProbe}
            size="icon-sm"
            type="button"
            variant="secondary"
          >
            <Activity className="size-3.5" />
          </Button>
        </div>
      </section>

      <section className="min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{copy.label.recentEvents}</h3>
          <Button
            aria-label="Probe Core from activity"
            className="size-8 rounded-md"
            disabled={sending}
            onClick={actions.probeCore}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <RefreshCw className={cn("size-3.5", sending && "animate-spin")} />
          </Button>
        </div>
        <div className="space-y-4 border-y py-3" data-testid="activity-event-list">
          {viewModel.recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {copy.label.waitingForCoreEvents}
            </p>
          ) : (
            viewModel.recentEvents.map((envelope) => (
              <div className="flex gap-2.5" key={envelope.eventId}>
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[11px] font-medium">
                      {envelope.event.type}
                    </p>
                    <time className="shrink-0 text-[10px] text-muted-foreground">
                      {formatEventTime(envelope.createdAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {eventLabel(envelope)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
