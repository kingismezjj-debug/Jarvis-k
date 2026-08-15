import {
  Activity,
  Bot,
  CheckCircle2,
  CircleAlert,
  Download,
  ListTodo,
  MessageSquare,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import type { EventEnvelope } from "@jarvis-k/contracts";

import type { uiCopy } from "@/app/copy";
import { eventLabel, formatEventTime } from "@/app/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Metric } from "@/components/shared/Metric";
import {
  SystemStatusPanel,
  type SystemStatusViewModel,
} from "@/features/diagnostics/system-status-panel";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];
type Tone = "success" | "warning" | "accent";

export type RuntimeInspectorMetric = {
  label: string;
  value: string;
  tone?: Tone;
};

export type RuntimeInspectorViewModel = {
  coreInstanceId?: string | null;
  coreOnline: boolean;
  memoryAlphaMetrics: RuntimeInspectorMetric[];
  memoryAlphaProbeDraft: string;
  memorySnapshotDraft: string;
  modelGovernanceMetrics: RuntimeInspectorMetric[];
  recentEvents: EventEnvelope[];
  systemStatus: SystemStatusViewModel;
};

export type RuntimeInspectorActions = {
  disableMemoryAlpha: () => void;
  exportMemorySnapshot: () => void;
  importMemorySnapshot: () => void;
  probeCore: () => void;
  refreshMemoryAlpha: () => void;
  refreshModelGovernance: () => void;
  runFixtureEmbeddingProbe: () => void;
  runFixtureIntentProbe: () => void;
  runFixtureOcrProbe: () => void;
  runFixtureRerankProbe: () => void;
  runMemoryAlphaProbe: () => void;
  setMemoryAlphaProbeDraft: (value: string) => void;
  setMemorySnapshotDraft: (value: string) => void;
};

export function RuntimeInspectorPanel({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: RuntimeInspectorActions;
  copy: Copy;
  sending: boolean;
  viewModel: RuntimeInspectorViewModel;
}) {
  return (
    <aside
      className="min-h-0 border-l bg-card max-[1080px]:hidden"
      data-testid="runtime-inspector"
    >
      <div className="flex h-full min-h-0 flex-col px-[18px] py-5">
        <SystemStatusPanel
          actions={{ probeCore: actions.probeCore }}
          copy={copy}
          sending={sending}
          viewModel={viewModel.systemStatus}
        />

        <div className="mt-4 shrink-0" data-testid="model-governance">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {copy.settings.modelGovernance}
            </h3>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Run fixture reranker"
                    className="size-8 rounded-md"
                    data-testid="run-fixture-reranker"
                    disabled={sending}
                    onClick={actions.runFixtureRerankProbe}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <ListTodo className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run fixture reranker</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Run fixture OCR"
                    className="size-8 rounded-md"
                    data-testid="run-fixture-ocr"
                    disabled={sending}
                    onClick={actions.runFixtureOcrProbe}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Activity className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run fixture OCR</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Run fixture intent routing"
                    className="size-8 rounded-md"
                    data-testid="run-fixture-intent"
                    disabled={sending}
                    onClick={actions.runFixtureIntentProbe}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <MessageSquare className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run fixture intent routing</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Run fixture embedding"
                    className="size-8 rounded-md"
                    data-testid="run-fixture-embedding"
                    disabled={sending}
                    onClick={actions.runFixtureEmbeddingProbe}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Bot className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run fixture embedding</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Refresh model governance"
                    className="size-8 rounded-md"
                    data-testid="refresh-model-governance"
                    disabled={sending}
                    onClick={actions.refreshModelGovernance}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <RefreshCw
                      className={cn("size-3.5", sending && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh model governance</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <dl className="divide-y divide-border border-y text-[11px]">
            {viewModel.modelGovernanceMetrics.map((item) => (
              <Metric
                key={item.label}
                label={item.label}
                tone={item.tone}
                value={item.value}
              />
            ))}
          </dl>
        </div>

        <div className="mt-4 shrink-0" data-testid="memory-alpha-spine">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {copy.settings.memoryAlpha}
            </h3>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Disable Memory alpha"
                    className="size-8 rounded-md"
                    data-testid="disable-memory-alpha"
                    disabled={sending}
                    onClick={actions.disableMemoryAlpha}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <X className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Disable Memory alpha</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Refresh Memory alpha"
                    className="size-8 rounded-md"
                    data-testid="refresh-memory-alpha"
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
                </TooltipTrigger>
                <TooltipContent>Refresh Memory alpha</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <dl className="divide-y divide-border border-y text-[11px]">
            {viewModel.memoryAlphaMetrics.map((item) => (
              <Metric
                key={item.label}
                label={item.label}
                tone={item.tone}
                value={item.value}
              />
            ))}
          </dl>
          <div className="mt-2 flex items-center gap-2">
            <Input
              aria-label="Memory alpha recall probe"
              className="h-8 rounded-md bg-input/45 px-2.5 text-[11px]"
              data-testid="memory-alpha-probe-input"
              onChange={(event) =>
                actions.setMemoryAlphaProbeDraft(event.target.value)
              }
              placeholder={copy.label.recallProbePlaceholder}
              value={viewModel.memoryAlphaProbeDraft}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Run Memory alpha recall probe"
                  className="size-8 rounded-md"
                  data-testid="run-memory-alpha-probe"
                  disabled={sending}
                  onClick={actions.runMemoryAlphaProbe}
                  size="icon-sm"
                  type="button"
                  variant="secondary"
                >
                  <Activity className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run Memory alpha recall probe</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-4 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {copy.label.memorySnapshot}
            </h3>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Export memory snapshot"
                    className="size-8 rounded-md"
                    data-testid="export-memory-snapshot"
                    disabled={sending}
                    onClick={actions.exportMemorySnapshot}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Download className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export memory snapshot</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Import memory snapshot"
                    className="size-8 rounded-md"
                    data-testid="import-memory-snapshot"
                    disabled={sending}
                    onClick={actions.importMemorySnapshot}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Upload className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import memory snapshot</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <Textarea
            aria-label={copy.label.memorySnapshotPlaceholder}
            className="h-[96px] resize-none rounded-md bg-input/45 font-mono text-[10px] leading-4"
            data-testid="memory-snapshot-json"
            onChange={(event) =>
              actions.setMemorySnapshotDraft(event.target.value)
            }
            placeholder={copy.label.memorySnapshotPlaceholder}
            spellCheck={false}
            value={viewModel.memorySnapshotDraft}
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{copy.label.recentEvents}</h3>
          <span className="text-[10px] text-muted-foreground">
            {viewModel.recentEvents.length} {copy.label.events}
          </span>
        </div>

        <ScrollArea className="mt-4 min-h-0 flex-1">
          <div className="space-y-4 pr-3" data-testid="event-list">
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
        </ScrollArea>

        <Separator className="my-4" />
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {viewModel.coreOnline ? (
            <CheckCircle2 className="size-3.5 text-success" />
          ) : (
            <CircleAlert className="size-3.5 text-warning" />
          )}
          <span data-testid="core-instance">
            {viewModel.coreInstanceId
              ? `instance ${viewModel.coreInstanceId.slice(-12)}`
              : "awaiting core instance"}
          </span>
        </div>
      </div>
    </aside>
  );
}
