import { Download, RefreshCw, Trash2, X } from "lucide-react";
import type { UserControlledMemoryRecord } from "@jarvis-k/contracts";

import {
  formatUserControlledMemoryKey,
  userControlledMemoryFilterOptions,
  userControlledMemoryRiskFilterOptions,
  userControlledMemorySortOptions,
} from "@/app/memory-view";
import type {
  UserControlledMemoryFilter,
  UserControlledMemoryRiskFilter,
  UserControlledMemorySort,
} from "@/app/types";
import { formatEventTime } from "@/app/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

export type MemoryCenterViewModel = {
  activeKindLabel: string;
  activeRiskLabel: string;
  activeSortLabel: string;
  deletePendingKey: string | null;
  filteredMemories: UserControlledMemoryRecord[];
  highRiskMemoryCount: number;
  lowRiskMemoryCount: number;
  mediumRiskMemoryCount: number;
  memoryQuery: string;
  preferenceMemoryCount: number;
  records: UserControlledMemoryRecord[];
  retentionControlsBoundary: string;
  retentionMutationBoundary: string;
  retentionScope: string;
  retentionSessionControlMode: string;
  recordingModeBoundary: string;
  searchState: string;
  selectedKind: UserControlledMemoryFilter;
  selectedRisk: UserControlledMemoryRiskFilter;
  selectedSort: UserControlledMemorySort;
  sessionOnlyBoundary: string;
  expirationBoundary: string;
  sanitizedSnapshotGeneratedAt: string | null;
  sanitizedSnapshotPreview: string;
  routeAliasMemoryCount: number;
  voiceAliasMemoryCount: number;
};

export type MemoryCenterActions = {
  clearSanitizedSnapshot(): void;
  deleteMemory(memory: UserControlledMemoryRecord): void;
  exportSanitizedSnapshot(): void;
  refresh(): void;
  resetControls(): void;
  setKindFilter(filter: UserControlledMemoryFilter): void;
  setMemoryQuery(query: string): void;
  setRiskFilter(filter: UserControlledMemoryRiskFilter): void;
  setSort(sort: UserControlledMemorySort): void;
};

export function MemoryCenter({
  actions,
  sending,
  viewModel,
}: {
  actions: MemoryCenterActions;
  sending: boolean;
  viewModel: MemoryCenterViewModel;
}) {
  const controlsAtDefaults =
    viewModel.selectedKind === "all" &&
    viewModel.selectedRisk === "all" &&
    viewModel.selectedSort === "updated_desc" &&
    viewModel.memoryQuery.trim().length === 0;
  const filteredUserControlledMemories = viewModel.filteredMemories;
  const userControlledMemoryActiveKindLabel = viewModel.activeKindLabel;
  const userControlledMemoryActiveRiskLabel = viewModel.activeRiskLabel;
  const userControlledMemoryActiveSortLabel = viewModel.activeSortLabel;
  const userControlledMemorySearchState = viewModel.searchState;

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">User-controlled memory</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Route aliases and voice correction aliases are visible here.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Refresh user-controlled memories"
              className="size-8 rounded-md"
              data-testid="user-controlled-memory-refresh"
              onClick={actions.refresh}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh user memory</TooltipContent>
        </Tooltip>
      </div>

      <div
        className="grid gap-3 sm:grid-cols-4 xl:grid-cols-7"
        data-testid="user-controlled-memory-summary"
      >
        <MemorySummaryCard label="Total" value={viewModel.records.length} />
        <MemorySummaryCard
          label="Route aliases"
          value={viewModel.routeAliasMemoryCount}
        />
        <MemorySummaryCard
          label="Voice aliases"
          value={viewModel.voiceAliasMemoryCount}
        />
        <MemorySummaryCard
          label="Preferences"
          value={viewModel.preferenceMemoryCount}
        />
        <div
          className="rounded-md border bg-card px-3 py-3"
          data-testid="user-controlled-memory-low-risk-count"
        >
          <p className="text-[10px] uppercase text-muted-foreground">
            Low risk
          </p>
          <p className="mt-1 text-lg font-semibold text-success">
            {viewModel.lowRiskMemoryCount}
          </p>
        </div>
        <div
          className="rounded-md border bg-card px-3 py-3"
          data-testid="user-controlled-memory-medium-risk-count"
        >
          <p className="text-[10px] uppercase text-muted-foreground">
            Medium risk
          </p>
          <p className="mt-1 text-lg font-semibold text-warning">
            {viewModel.mediumRiskMemoryCount}
          </p>
        </div>
        <div
          className="rounded-md border bg-card px-3 py-3"
          data-testid="user-controlled-memory-high-risk-count"
        >
          <p className="text-[10px] uppercase text-muted-foreground">
            High risk
          </p>
          <p className="mt-1 text-lg font-semibold text-destructive">
            {viewModel.highRiskMemoryCount}
          </p>
        </div>
      </div>

      <div
        className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
        data-testid="user-controlled-memory-filter-bar"
      >
        <Input
          data-testid="user-controlled-memory-search"
          onChange={(event) => actions.setMemoryQuery(event.target.value)}
          placeholder="Filter user memory"
          value={viewModel.memoryQuery}
        />
        <div
          className="flex flex-wrap gap-2"
          data-testid="user-controlled-memory-kind-filter"
        >
          {userControlledMemoryFilterOptions.map((option) => (
            <Button
              className="h-9 rounded-md px-3 text-[11px]"
              data-testid={`user-controlled-memory-kind-filter-${option.id}`}
              key={option.id}
              onClick={() => actions.setKindFilter(option.id)}
              type="button"
              variant={
                viewModel.selectedKind === option.id ? "default" : "outline"
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div
          className="flex flex-wrap gap-2 md:col-span-2"
          data-testid="user-controlled-memory-risk-filter"
        >
          {userControlledMemoryRiskFilterOptions.map((option) => (
            <Button
              className="h-8 rounded-md px-2 text-[11px]"
              data-testid={`user-controlled-memory-risk-filter-${option.id}`}
              key={option.id}
              onClick={() => actions.setRiskFilter(option.id)}
              type="button"
              variant={
                viewModel.selectedRisk === option.id ? "default" : "outline"
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div
          className="flex flex-wrap gap-2 md:col-span-2"
          data-testid="user-controlled-memory-sort"
        >
          {userControlledMemorySortOptions.map((option) => (
            <Button
              className="h-8 rounded-md px-2 text-[11px]"
              data-testid={`user-controlled-memory-sort-${option.id}`}
              key={option.id}
              onClick={() => actions.setSort(option.id)}
              type="button"
              variant={
                viewModel.selectedSort === option.id ? "default" : "outline"
              }
            >
              {option.label}
            </Button>
          ))}
          <Button
            className="h-8 rounded-md px-2 text-[11px]"
            data-testid="user-controlled-memory-reset-controls"
            disabled={controlsAtDefaults}
            onClick={actions.resetControls}
            type="button"
            variant="outline"
          >
            Reset
          </Button>
        </div>
        <p
          className="text-[11px] text-muted-foreground md:col-span-2"
          data-testid="user-controlled-memory-filter-summary"
        >
          Showing {filteredUserControlledMemories.length} of{" "}
          {viewModel.records.length} user-controlled memories.
        </p>
        <div
          className="flex flex-wrap gap-2 md:col-span-2"
          data-testid="user-controlled-memory-active-view-criteria"
        >
          <Badge className="rounded-md text-[10px]" variant="outline">
            Kind: {userControlledMemoryActiveKindLabel}
          </Badge>
          <Badge className="rounded-md text-[10px]" variant="outline">
            Risk: {userControlledMemoryActiveRiskLabel}
          </Badge>
          <Badge className="rounded-md text-[10px]" variant="outline">
            Sort: {userControlledMemoryActiveSortLabel}
          </Badge>
          <Badge className="rounded-md text-[10px]" variant="outline">
            Search: {userControlledMemorySearchState}
          </Badge>
        </div>
      </div>

      <div
        className="mt-5 rounded-md border bg-card p-3"
        data-testid="user-controlled-memory-retention-session-controls"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-xs font-semibold">Retention / session controls</h4>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Policy controls are visible for review; runtime mutation is
              disabled in this L3 slice.
            </p>
          </div>
          <Badge className="rounded-md text-[10px]" variant="outline">
            {viewModel.retentionSessionControlMode}
          </Badge>
        </div>
        <div
          className="mt-3 grid gap-2 sm:grid-cols-2"
          data-testid="user-controlled-memory-retention-session-status"
        >
          <Metric
            label="Retention controls"
            tone="warning"
            value={viewModel.retentionControlsBoundary}
          />
          <Metric
            label="Retention scope"
            tone="success"
            value={viewModel.retentionScope}
          />
          <Metric
            label="Session-only mode"
            tone="warning"
            value={viewModel.sessionOnlyBoundary}
          />
          <Metric
            label="Expiration control"
            tone="warning"
            value={viewModel.expirationBoundary}
          />
          <Metric
            label="Recording mode"
            tone="success"
            value={viewModel.recordingModeBoundary}
          />
          <Metric
            label="Runtime mutation"
            tone="success"
            value={viewModel.retentionMutationBoundary}
          />
        </div>
        <div
          className="mt-3 flex flex-wrap gap-2 border-t pt-3"
          data-testid="user-controlled-memory-retention-controls-disabled"
        >
          <Button
            className="h-8 rounded-md px-2 text-[11px]"
            data-testid="user-controlled-memory-session-only-toggle"
            disabled
            type="button"
            variant="outline"
          >
            Session-only memory disabled
          </Button>
          <Button
            className="h-8 rounded-md px-2 text-[11px]"
            data-testid="user-controlled-memory-expiration-control"
            disabled
            type="button"
            variant="outline"
          >
            Expiration disabled
          </Button>
          <Button
            className="h-8 rounded-md px-2 text-[11px]"
            data-testid="user-controlled-memory-retention-mutation-control"
            disabled
            type="button"
            variant="outline"
          >
            Retention mutation disabled
          </Button>
        </div>
        <p
          className="mt-3 text-[10px] text-muted-foreground"
          data-testid="user-controlled-memory-retention-policy-summary"
        >
          Auto capture, import, restore, vector retrieval, session-only writes,
          and expiration jobs remain disabled.
        </p>
      </div>

      <div
        className="mt-5 rounded-md border bg-card p-3"
        data-testid="user-controlled-memory-sanitized-snapshot"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-xs font-semibold">Sanitized snapshot</h4>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Exports visible user-controlled memory metadata only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-8 rounded-md px-2 text-[11px]"
              data-testid="user-controlled-memory-export-sanitized-snapshot"
              onClick={actions.exportSanitizedSnapshot}
              type="button"
              variant="outline"
            >
              <Download className="mr-1.5 size-3" />
              Export snapshot
            </Button>
            <Button
              className="h-8 rounded-md px-2 text-[11px]"
              data-testid="user-controlled-memory-clear-sanitized-snapshot"
              disabled={viewModel.sanitizedSnapshotPreview.trim().length === 0}
              onClick={actions.clearSanitizedSnapshot}
              type="button"
              variant="outline"
            >
              <X className="mr-1.5 size-3" />
              Clear
            </Button>
          </div>
        </div>
        <div
          className="mt-3 flex flex-wrap gap-2"
          data-testid="user-controlled-memory-sanitized-snapshot-policy"
        >
          {[
            "SCHEMA_V1",
            "SANITIZED_VISIBLE_FIELDS_ONLY",
            "USER_INITIATED",
            "IMPORT_DISABLED",
            "RESTORE_DISABLED",
          ].map((label) => (
            <Badge className="rounded-md text-[10px]" key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
        {viewModel.sanitizedSnapshotPreview.trim().length > 0 ? (
          <Textarea
            className="mt-3 min-h-40 resize-y rounded-md font-mono text-[11px]"
            data-testid="user-controlled-memory-sanitized-snapshot-json"
            readOnly
            value={viewModel.sanitizedSnapshotPreview}
          />
        ) : (
          <p
            className="mt-3 border-t pt-3 text-[11px] text-muted-foreground"
            data-testid="user-controlled-memory-sanitized-snapshot-empty"
          >
            No sanitized snapshot generated.
          </p>
        )}
        <p
          className="mt-2 text-[10px] text-muted-foreground"
          data-testid="user-controlled-memory-sanitized-snapshot-status"
        >
          {viewModel.sanitizedSnapshotGeneratedAt
            ? `Generated ${viewModel.sanitizedSnapshotGeneratedAt} / ${viewModel.records.length} records / raw hidden`
            : "Idle / raw hidden / no import or restore action"}
        </p>
      </div>

      <div
        className="mt-5 divide-y divide-border border-y"
        data-testid="user-controlled-memory-list"
      >
        {filteredUserControlledMemories.length > 0 ? (
          filteredUserControlledMemories.map((memory) => {
            const deletePending =
              viewModel.deletePendingKey ===
              formatUserControlledMemoryKey(memory);
            return (
              <div
                className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                data-testid="user-controlled-memory-record"
                key={memory.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className="rounded-md text-[10px]"
                      data-testid="user-controlled-memory-kind"
                      variant="secondary"
                    >
                      {memory.kind}
                    </Badge>
                    <Badge
                      className={cn(
                        "rounded-md text-[10px]",
                        memory.risk === "medium"
                          ? "text-warning"
                          : memory.risk === "high"
                            ? "text-destructive"
                            : "text-success",
                      )}
                      data-testid="user-controlled-memory-risk"
                      variant="outline"
                    >
                      {memory.risk}
                    </Badge>
                    <Badge
                      className="rounded-md text-[10px]"
                      data-testid="user-controlled-memory-raw-hidden"
                      variant="outline"
                    >
                      RAW_HIDDEN
                    </Badge>
                    {memory.kind === "preference" ? (
                      <Badge
                        className="rounded-md text-[10px]"
                        data-testid="user-controlled-memory-provider-neutral"
                        variant="outline"
                      >
                        PROVIDER_NEUTRAL
                      </Badge>
                    ) : null}
                    {memory.deletable ? (
                      <Badge
                        className="rounded-md text-[10px]"
                        data-testid="user-controlled-memory-delete-policy"
                        variant="outline"
                      >
                        VIEW_DELETE
                      </Badge>
                    ) : null}
                    <Badge
                      className="rounded-md text-[10px]"
                      data-testid="user-controlled-memory-disable-policy"
                      variant="outline"
                    >
                      DISABLE_NOT_ENABLED
                    </Badge>
                  </div>
                  <p
                    className="mt-2 truncate text-sm font-semibold"
                    data-testid="user-controlled-memory-label"
                  >
                    {memory.label}
                  </p>
                  <p
                    className="mt-1 truncate text-xs text-muted-foreground"
                    data-testid="user-controlled-memory-summary-text"
                  >
                    {memory.summary}
                  </p>
                  {memory.kind === "preference" &&
                  memory.preferenceKey &&
                  memory.preferenceValue ? (
                    <p
                      className="mt-1 truncate text-[10px] uppercase text-muted-foreground"
                      data-testid="user-controlled-memory-active-preference"
                    >
                      Active policy: {memory.preferenceKey} ={" "}
                      {memory.preferenceValue}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                    {memory.source} / {formatEventTime(memory.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    className="h-8 rounded-md px-2 text-[11px]"
                    data-testid="user-controlled-memory-disable"
                    disabled
                    type="button"
                    variant="outline"
                  >
                    Disable
                  </Button>
                  <Button
                    className="h-8 rounded-md px-2 text-[11px]"
                    data-testid="user-controlled-memory-delete"
                    disabled={sending || !memory.deletable || deletePending}
                    onClick={() => actions.deleteMemory(memory)}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="mr-1.5 size-3" />
                    {deletePending ? "Deleting" : "Delete"}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p
            className="py-5 text-xs text-muted-foreground"
            data-testid="user-controlled-memory-empty"
          >
            {viewModel.records.length > 0
              ? "No user-controlled memories match this filter."
              : "No user-controlled memories have been saved yet."}
          </p>
        )}
      </div>
    </section>
  );
}

function MemorySummaryCard({
  label,
  testId,
  value,
  valueClassName,
}: {
  label: string;
  testId?: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md border bg-card px-3 py-3" data-testid={testId}>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold", valueClassName)}>{value}</p>
    </div>
  );
}
