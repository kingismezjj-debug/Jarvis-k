import { Check, CircleAlert, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatConfidence,
  formatVoiceCorrectionSlots,
} from "@/app/formatters";

import type { ConversationActions, ConversationViewModel } from "./types";

export function SessionHistoryPanel({
  actions,
  viewModel,
}: {
  actions: Pick<ConversationActions, "clearSessionHistory">;
  viewModel: Pick<
    ConversationViewModel,
    "alphaCopy" | "sending" | "sessionHistory"
  >;
}) {
  const { alphaCopy, sending, sessionHistory } = viewModel;
  return (
    <section
      className="max-w-[760px] border-y py-3"
      data-testid="stage5-session-history"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-muted-foreground">
          {alphaCopy.history}
        </p>
        <Button
          aria-label={alphaCopy.clearHistory}
          className="size-7 rounded-md"
          data-testid="stage5-clear-history"
          disabled={sending || sessionHistory.length === 0}
          onClick={actions.clearSessionHistory}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {sessionHistory.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          {alphaCopy.historyEmpty}
        </p>
      ) : (
        <div className="space-y-1.5">
          {sessionHistory.slice(0, 6).map((entry) => (
            <div
              className="grid gap-1 text-[11px] sm:grid-cols-[minmax(0,1fr)_auto]"
              key={entry.id}
            >
              <span className="min-w-0 truncate">
                {entry.source} / {entry.intent} /{" "}
                {entry.selectedToolId ?? alphaCopy.noTool}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {entry.dispatchStatus} / {entry.memoryContextStatus}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function VoiceCorrectionCandidates({
  actions,
  viewModel,
}: {
  actions: Pick<ConversationActions, "confirmVoiceCommandCorrection">;
  viewModel: Pick<ConversationViewModel, "brainResult" | "sending">;
}) {
  const { brainResult, sending } = viewModel;
  if (
    !brainResult?.voiceCorrection?.requiresUserSelection ||
    brainResult.correctionCandidates.length === 0
  ) {
    return null;
  }

  return (
    <div
      className="max-w-[760px] rounded-md border bg-card px-4 py-3"
      data-testid="voice-correction-candidates"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase text-muted-foreground">
            Voice correction
          </p>
          <p
            className="mt-1 truncate text-xs"
            data-testid="voice-correction-raw-transcript"
          >
            {brainResult.rawTranscript ?? brainResult.text}
          </p>
        </div>
        <Badge className="rounded-md text-[10px]" variant="outline">
          choose one
        </Badge>
      </div>
      <div className="grid gap-2">
        {brainResult.correctionCandidates.map((candidate, index) => (
          <Button
            className="h-auto justify-between gap-3 rounded-md px-3 py-2 text-left"
            data-testid="voice-correction-candidate"
            disabled={sending}
            key={`${candidate.intent}-${index}`}
            onClick={() => actions.confirmVoiceCommandCorrection(candidate)}
            type="button"
            variant="outline"
          >
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">
                {candidate.label}
              </span>
              <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                {candidate.intent} / {formatVoiceCorrectionSlots(candidate.slots)}
              </span>
            </span>
            <span className="shrink-0 text-[11px] font-medium text-accent">
              {formatConfidence(candidate.confidence)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function UserRouteAliasProposal({
  actions,
  viewModel,
}: {
  actions: Pick<ConversationActions, "confirmUserRouteAlias">;
  viewModel: Pick<ConversationViewModel, "brainResult" | "sending">;
}) {
  const proposal = viewModel.brainResult?.userRouteAliasProposal;
  if (!proposal) return null;

  return (
    <div
      className="max-w-[760px] rounded-md border bg-card px-4 py-3"
      data-testid="user-route-alias-proposal"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase text-muted-foreground">
            Route alias memory
          </p>
          <p
            className="mt-1 truncate text-xs font-semibold"
            data-testid="user-route-alias-proposal-label"
          >
            {proposal.label}
          </p>
        </div>
        <Badge className="rounded-md text-[10px]" variant="outline">
          confirm save
        </Badge>
      </div>
      <div className="grid gap-1.5 text-[11px] text-muted-foreground">
        <p className="truncate">browser.open / {proposal.targetHostname}</p>
        <p className="truncate">{proposal.targetUrl}</p>
        <p className="uppercase">{proposal.urlPolicy}</p>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          className="h-8 rounded-md px-3 text-[11px]"
          data-testid="user-route-alias-save"
          disabled={viewModel.sending}
          onClick={() => actions.confirmUserRouteAlias(proposal)}
          type="button"
          variant="outline"
        >
          <Check className="mr-1.5 size-3" />
          Save alias
        </Button>
      </div>
    </div>
  );
}

export function AgentAcceptedStatus({
  events,
}: Pick<ConversationViewModel, "events">) {
  const accepted = events.some(
    (item) => item.event.type === "agent.message.accepted",
  );
  if (!accepted) return null;

  return (
    <div className="flex w-fit items-center gap-2 rounded-md border bg-muted px-3 py-2 text-[11px] text-muted-foreground">
      <span className="size-1.5 rounded-full bg-accent" />
      agent.message.accepted / correlated command
    </div>
  );
}

export function VoiceTranscriptPanel({
  copy,
  voiceProjection,
}: Pick<ConversationViewModel, "copy" | "voiceProjection">) {
  if (
    voiceProjection.hidden ||
    (!voiceProjection.transcript && voiceProjection.state === "idle")
  ) {
    return null;
  }

  return (
    <div
      className="max-w-[760px] rounded-md border bg-card px-4 py-3"
      data-testid="voice-transcript-panel"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          {copy.label.voiceTranscript}
        </p>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {voiceProjection.isFinal ? "FINAL" : voiceProjection.state.toUpperCase()}
        </Badge>
      </div>
      <p
        className="mt-2 min-h-5 text-sm leading-6"
        data-testid="voice-transcript"
      >
        {voiceProjection.transcript || "Listening..."}
      </p>
    </div>
  );
}

export function ConversationError({ error }: Pick<ConversationViewModel, "error">) {
  if (!error) return null;
  return (
    <div className="flex w-fit items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <CircleAlert className="size-3.5" />
      {error}
    </div>
  );
}
