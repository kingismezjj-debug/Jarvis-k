import { RefreshCw, RotateCcw, Volume2, VolumeX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ConversationActions, ConversationViewModel } from "./types";

export type BrainDispatchPanelProps = {
  actions: Pick<
    ConversationActions,
    | "playLocalTts"
    | "retryBrainCommand"
    | "rollbackBrainResult"
    | "stopLocalTts"
  >;
  viewModel: Pick<
    ConversationViewModel,
    "alphaCopy" | "brainResult" | "copy" | "sending" | "tts"
  >;
};

export function BrainDispatchPanel({
  actions,
  viewModel,
}: BrainDispatchPanelProps) {
  const { alphaCopy, brainResult, copy, sending, tts } = viewModel;
  if (!brainResult) return null;

  const toolProductLoop = brainResult.toolProductLoop;
  const alphaHardening = brainResult.alphaHardening;
  const selectedToolDescriptor = toolProductLoop?.descriptors.find(
    (item) => item.id === toolProductLoop.selectedToolId,
  );

  return (
    <div
      className="max-w-[760px] rounded-md border bg-card px-4 py-3"
      data-testid="brain-dispatch-panel"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{copy.label.brainDispatch}</h3>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {brainResult.dispatchStatus}
        </Badge>
      </div>
      <dl className="grid gap-2 text-[11px] sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">{copy.label.brainSource}</dt>
          <dd
            className="mt-0.5 truncate font-medium"
            data-testid="brain-source"
          >
            {brainResult.source}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{copy.label.brainIntent}</dt>
          <dd
            className="mt-0.5 truncate font-medium"
            data-testid="brain-intent"
          >
            {brainResult.decision.intent}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {copy.label.brainConfidence}
          </dt>
          <dd className="mt-0.5 font-medium">
            {Math.round(brainResult.decision.confidence * 100)}%
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{copy.label.brainStatus}</dt>
          <dd className="mt-0.5 truncate font-medium">
            {brainResult.decision.requiresApproval ? "approval" : "ready"}
          </dd>
        </div>
      </dl>

      {brainResult.routerSelection && (
        <div
          className="mt-3 grid gap-2 border-y py-2 text-[11px] sm:grid-cols-4"
          data-testid="command-router-safety-projection"
        >
          <div className="min-w-0">
            <p className="text-muted-foreground">Router</p>
            <p
              className="mt-1 truncate font-medium"
              data-testid="command-router-selected-provider"
            >
              {brainResult.routerSelection.selectedProviderId}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground">Route status</p>
            <p className="mt-1 truncate font-medium">
              {brainResult.routerSelection.status}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground">Confidence band</p>
            <p className="mt-1 truncate font-medium">
              {brainResult.routerSelection.confidenceBand}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground">Direct action</p>
            <p
              className="mt-1 truncate font-medium"
              data-testid="command-router-direct-action"
            >
              {brainResult.routerSelection.directActionAttempted
                ? "attempted"
                : "disabled"}
            </p>
          </div>
        </div>
      )}

      <p
        className="mt-3 text-xs leading-5 text-muted-foreground"
        data-testid="brain-summary"
      >
        {brainResult.summary}
      </p>

      {brainResult.pluginResult && (
        <div
          className="mt-3 rounded-md border bg-background px-3 py-2"
          data-testid="plugin-result-panel"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-semibold">
              {brainResult.pluginResult.capability}
            </p>
            <Badge className="rounded-md text-[10px]" variant="outline">
              {brainResult.pluginResult.status}
            </Badge>
          </div>
          {brainResult.pluginResult.output && (
            <p
              className="mt-1.5 text-xs leading-5 text-muted-foreground"
              data-testid="plugin-result-summary"
            >
              {brainResult.pluginResult.output.summary}
            </p>
          )}
          {brainResult.pluginResult.output?.items[0] && (
            <div
              className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-3"
              data-testid="plugin-result-fields"
            >
              {brainResult.pluginResult.output.items[0].fields
                .slice(0, 3)
                .map((field) => (
                  <div className="min-w-0" key={field.label}>
                    <p className="truncate text-muted-foreground">
                      {field.label}
                    </p>
                    <p className="truncate font-medium">
                      {String(field.value)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {toolProductLoop && (
        <div
          className="mt-3 border-t pt-3"
          data-testid="tool-product-loop-panel"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              Tool Product Loop
            </p>
            <Badge className="rounded-md text-[10px]" variant="secondary">
              {toolProductLoop.mode.replace("_", " ")}
            </Badge>
          </div>
          <dl className="grid gap-2 text-[11px] sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Registry</dt>
              <dd className="mt-0.5 truncate font-medium">
                {toolProductLoop.descriptors.length} fixture tools
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Selected Tool</dt>
              <dd
                className="mt-0.5 truncate font-medium"
                data-testid="tool-loop-selected-tool"
              >
                {toolProductLoop.selectedToolId ?? "none"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Safety</dt>
              <dd
                className="mt-0.5 truncate font-medium"
                data-testid="tool-loop-safety"
              >
                {toolProductLoop.safety?.reasonCode ?? "blocked"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Result</dt>
              <dd
                className="mt-0.5 truncate font-medium"
                data-testid="tool-loop-result"
              >
                {toolProductLoop.execution?.resultCode ?? "not_run"}
              </dd>
            </div>
          </dl>
          <div className="mt-3 grid gap-2 border-y py-2 text-[11px] sm:grid-cols-3">
            <div className="min-w-0">
              <p className="text-muted-foreground">Descriptor</p>
              <p className="mt-1 truncate font-medium">
                {selectedToolDescriptor
                  ? `${selectedToolDescriptor.label} / ${selectedToolDescriptor.risk}`
                  : "No descriptor selected"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground">Confirmation</p>
              <p className="mt-1 truncate font-medium">
                {toolProductLoop.safety?.confirmationRequired
                  ? toolProductLoop.safety.audit.confirmationGranted
                    ? "granted"
                    : "required"
                  : "not required"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground">Rollback</p>
              <p className="mt-1 truncate font-medium">
                {toolProductLoop.rollbackState}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            {toolProductLoop.summary}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            Evidence: persisted {String(toolProductLoop.persisted)} / raw
            diagnostics {String(toolProductLoop.rawDiagnosticsExposed)}
          </p>
          <div
            className="mt-3 space-y-1.5"
            data-testid="tool-loop-lifecycle"
          >
            {toolProductLoop.lifecycle.map((step) => (
              <div
                className="flex items-center justify-between gap-3 text-[11px]"
                key={`${step.stage}-${step.label}`}
              >
                <span className="min-w-0 truncate">
                  {step.stage.replaceAll("_", " ")}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {step.status}
                  {step.reasonCode ? ` / ${step.reasonCode}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {alphaHardening && (
        <div className="mt-3 border-t pt-3" data-testid="stage5-alpha-panel">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              {alphaCopy.title}
            </p>
            <Badge className="rounded-md text-[10px]" variant="outline">
              {alphaHardening.schemaVersion}
            </Badge>
          </div>
          <dl className="grid gap-2 text-[11px] sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">
                {alphaCopy.memoryContext}
              </dt>
              <dd
                className="mt-0.5 truncate font-medium"
                data-testid="stage5-memory-context"
              >
                {alphaHardening.memoryContext.status} /{" "}
                {alphaHardening.memoryContext.matchCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{alphaCopy.safety}</dt>
              <dd className="mt-0.5 truncate font-medium">
                {alphaHardening.retry.safetyPathReentered
                  ? alphaCopy.preserved
                  : alphaCopy.blocked}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{alphaCopy.retry}</dt>
              <dd className="mt-0.5 truncate font-medium">
                {alphaHardening.retry.status}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{alphaCopy.tts}</dt>
              <dd
                className="mt-0.5 truncate font-medium"
                data-testid="stage5-tts-status"
              >
                {tts.displayedStatus}
              </dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              aria-label={alphaCopy.retry}
              className="h-7 rounded-md px-2 text-xs"
              data-testid="stage5-retry"
              disabled={sending || alphaHardening.retry.status !== "available"}
              onClick={actions.retryBrainCommand}
              type="button"
              variant="outline"
            >
              <RefreshCw className="size-3.5" />
              {alphaCopy.retry}
            </Button>
            <Button
              aria-label={alphaCopy.rollback}
              className="h-7 rounded-md px-2 text-xs"
              data-testid="stage5-rollback"
              disabled={alphaHardening.rollback.status !== "available"}
              onClick={actions.rollbackBrainResult}
              type="button"
              variant="ghost"
            >
              <RotateCcw className="size-3.5" />
              {alphaCopy.rollback}
            </Button>
            <Button
              aria-label={
                tts.status === "playing" ? alphaCopy.stop : alphaCopy.play
              }
              className="h-7 rounded-md px-2 text-xs"
              data-testid="stage5-local-tts"
              disabled={tts.status !== "playing" && !tts.eligible}
              onClick={() => {
                if (tts.status === "playing") {
                  actions.stopLocalTts();
                  return;
                }
                actions.playLocalTts();
              }}
              type="button"
              variant="ghost"
            >
              {tts.status === "playing" ? (
                <VolumeX className="size-3.5" />
              ) : (
                <Volume2 className="size-3.5" />
              )}
              {tts.status === "playing" ? alphaCopy.stop : alphaCopy.play}
            </Button>
          </div>
          {tts.error && (
            <p
              className="mt-2 text-[10px] leading-4 text-warning"
              data-testid="stage5-tts-error"
            >
              {tts.error}
            </p>
          )}
          <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
            {alphaHardening.memoryContext.readOnly
              ? `${alphaCopy.memoryContext}: ${alphaCopy.readOnly}`
              : `${alphaCopy.memoryContext}: ${alphaCopy.blocked}`}
            {" / "}
            {tts.enabled ? alphaCopy.ttsEnabled : alphaCopy.ttsDisabled}
          </p>
        </div>
      )}

      <div className="mt-3 border-t pt-3">
        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
          {copy.label.brainPlan}
        </p>
        <div className="space-y-1.5">
          {brainResult.plan.map((step) => (
            <div
              className="flex items-center justify-between gap-3 text-[11px]"
              key={step.id}
            >
              <span className="truncate">{step.title}</span>
              <span className="shrink-0 text-muted-foreground">
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
