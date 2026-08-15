import { Play, RefreshCw, RotateCcw, Square } from "lucide-react";

import type { uiCopy } from "@/app/copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];
type Tone = "success" | "warning" | "accent";

export type CommandRouterMetric = {
  label: string;
  value: string;
  tone?: Tone;
};

export type CommandRouterSettingsViewModel = {
  activationGateLabels: string[];
  activationPolicyId: string;
  gateLabels: string[];
  headerBadge: string;
  productModeEnabled: boolean;
  productModeNotice: string;
  productModeSummary: string;
  qwenRuntimeControlHelper: string;
  qwenRuntimeControlSession: string;
  qwenRuntimeControlSummary: string;
  qwenRuntimeControlMetrics: CommandRouterMetric[];
  qwenRuntimeControlStartAvailable: boolean;
  qwenRuntimeControlStopAvailable: boolean;
  qwenRuntimeControlRollbackAvailable: boolean;
  qwenStatus: string;
  routeMetrics: CommandRouterMetric[];
  qwenMetrics: CommandRouterMetric[];
};

export type CommandRouterSettingsActions = {
  refreshProductMode: () => void;
  refreshQwenRuntimeControl: () => void;
  setProductModeEnabled: (enabled: boolean) => void;
  startQwenRuntimeControl: () => void;
  stopQwenRuntimeControl: () => void;
  rollbackQwenRuntimeControl: () => void;
};

export function CommandRouterSettingsPanel({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: CommandRouterSettingsActions;
  copy: Copy;
  sending: boolean;
  viewModel: CommandRouterSettingsViewModel;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{copy.settings.commandRouter}</h3>
        <div className="flex items-center gap-1.5">
          <Badge
            className="rounded-md text-[10px]"
            variant={viewModel.productModeEnabled ? "default" : "outline"}
          >
            {viewModel.headerBadge}
          </Badge>
          <Button
            aria-label="Refresh Command Router product mode"
            className="size-8 rounded-md"
            data-testid="settings-refresh-command-router-product-mode"
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
        {viewModel.routeMetrics.map((item) => (
          <Metric
            key={item.label}
            label={item.label}
            tone={item.tone}
            value={item.value}
          />
        ))}
      </dl>
      <div
        className="border-b py-3 text-[11px]"
        data-testid="settings-command-router-qwen-binding"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Qwen Fast Router</span>
          <Badge
            className="rounded-md text-[10px]"
            data-testid="settings-command-router-qwen-status"
            variant="outline"
          >
            {viewModel.qwenStatus}
          </Badge>
        </div>
        <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {viewModel.qwenMetrics.map((item) => (
            <Metric
              key={item.label}
              label={item.label}
              tone={item.tone}
              value={item.value}
            />
          ))}
        </dl>
        <div
          className="mt-2 border-t pt-2"
          data-testid="settings-command-router-qwen-activation"
        >
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>Activation policy</span>
            <Badge className="rounded-md text-[10px]" variant="outline">
              {viewModel.activationPolicyId}
            </Badge>
            <Badge className="rounded-md text-[10px]" variant="outline">
              product route off
            </Badge>
            <Badge className="rounded-md text-[10px]" variant="outline">
              fixture rollback
            </Badge>
          </div>
          <div
            className="mt-2 flex flex-wrap gap-1.5"
            data-testid="settings-command-router-qwen-activation-gates"
          >
            {viewModel.activationGateLabels.map((label) => (
              <span
                className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div
          className="mt-2 flex flex-wrap gap-1.5"
          data-testid="settings-command-router-qwen-gates"
        >
          {viewModel.gateLabels.map((label) => (
            <span
              className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
              key={label}
            >
              {label}
            </span>
          ))}
        </div>
        <div
          className="mt-3 border-t pt-3"
          data-testid="settings-command-router-qwen-runtime-control"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-medium">
                Retained Qwen session control
              </div>
              <div
                className="mt-1 text-[10px] text-muted-foreground"
                data-testid="settings-command-router-qwen-runtime-control-status"
              >
                {viewModel.qwenRuntimeControlSummary} /{" "}
                {viewModel.qwenRuntimeControlSession} /{" "}
                {viewModel.qwenRuntimeControlHelper}
              </div>
            </div>
            <Button
              aria-label="Refresh Qwen runtime control"
              className="size-8 rounded-md"
              data-testid="settings-refresh-qwen-runtime-control"
              disabled={sending}
              onClick={actions.refreshQwenRuntimeControl}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <RefreshCw
                className={cn("size-3.5", sending && "animate-spin")}
              />
            </Button>
          </div>
          <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {viewModel.qwenRuntimeControlMetrics.map((item) => (
              <Metric
                key={item.label}
                label={item.label}
                tone={item.tone}
                value={item.value}
              />
            ))}
          </dl>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              aria-label="Start Qwen runtime control"
              className="h-8 rounded-md px-2 text-[11px]"
              data-testid="settings-command-router-qwen-runtime-control-start"
              disabled={sending || !viewModel.qwenRuntimeControlStartAvailable}
              onClick={actions.startQwenRuntimeControl}
              size="sm"
              type="button"
              variant="outline"
            >
              <Play className="size-3.5" />
              Start
            </Button>
            <Button
              aria-label="Stop Qwen runtime control"
              className="h-8 rounded-md px-2 text-[11px]"
              data-testid="settings-command-router-qwen-runtime-control-stop"
              disabled={sending || !viewModel.qwenRuntimeControlStopAvailable}
              onClick={actions.stopQwenRuntimeControl}
              size="sm"
              type="button"
              variant="outline"
            >
              <Square className="size-3.5" />
              Stop
            </Button>
            <Button
              aria-label="Rollback Qwen runtime control"
              className="h-8 rounded-md px-2 text-[11px]"
              data-testid="settings-command-router-qwen-runtime-control-rollback"
              disabled={
                sending || !viewModel.qwenRuntimeControlRollbackAvailable
              }
              onClick={actions.rollbackQwenRuntimeControl}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-3.5" />
              Rollback
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "default off",
              "explicit opt-in",
              "fixture fallback",
              "Notepad/Calculator only",
            ].map((label) => (
              <Badge
                className="rounded-md text-[10px]"
                key={label}
                variant="outline"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <label className="mt-3 flex items-center justify-between gap-3 border-y py-2 text-[11px]">
        <span className="min-w-0">
          <span className="block font-medium">
            Deterministic router control
          </span>
          <span className="mt-0.5 block text-muted-foreground">
            {viewModel.productModeSummary}
          </span>
        </span>
        <input
          aria-label="Command Router product mode control"
          checked={viewModel.productModeEnabled}
          className="size-4 accent-primary"
          data-testid="settings-command-router-product-mode-toggle"
          onChange={(event) =>
            actions.setProductModeEnabled(event.target.checked)
          }
          type="checkbox"
        />
      </label>
      <p
        className="mt-2 text-[11px] leading-4 text-muted-foreground"
        data-testid="settings-command-router-product-mode-notice"
      >
        {viewModel.productModeNotice}
      </p>
    </section>
  );
}
