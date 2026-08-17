import { Download, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  VoiceRegressionCollectionStatus,
  VoiceRegressionDualFeedback,
  VoiceRegressionRecord,
  VoiceRegressionResolutionFeedbackStatus,
  VoiceRegressionSample,
  VoiceRegressionTranscriptFeedbackStatus,
} from "@jarvis-k/contracts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { VoiceCaptureActions, VoiceRegressionViewModel } from "./types";

export type VoiceRegressionPanelProps = {
  actions: Pick<
    VoiceCaptureActions,
    | "cancelPilotSession"
    | "clearRegressionPendingSamples"
    | "clearRegressionRecords"
    | "discardRegressionPendingSample"
    | "markPilotNoFinalTranscript"
    | "markPilotOperatorDeviation"
    | "deleteRegressionRecord"
    | "exportRegressionRecords"
    | "preparePilotSession"
    | "refreshRegressionRecords"
    | "saveRegressionPendingSample"
    | "startPilotPrompt"
    | "setRegressionLocalTextCollection"
    | "submitRegressionFeedback"
  >;
  sending: boolean;
  viewModel: VoiceRegressionViewModel;
};

type DraftFeedback = {
  correctedText: string;
  overrideFeedbackWarning: boolean;
  resolutionStatus: VoiceRegressionResolutionFeedbackStatus;
  transcriptStatus: VoiceRegressionTranscriptFeedbackStatus;
};

type FeedbackWarning =
  | "accepted_resolution_without_candidate"
  | "expected_intent_matched_prefer_wrong_slots"
  | "dangerous_prompt_should_block"
  | "negative_prompt_should_not_route";

const DEFAULT_DRAFT: DraftFeedback = {
  correctedText: "",
  overrideFeedbackWarning: false,
  resolutionStatus: "unreviewed",
  transcriptStatus: "unreviewed",
};

const RESOLUTION_OPTIONS: readonly {
  label: string;
  status: VoiceRegressionResolutionFeedbackStatus;
}[] = [
  { label: "Intent and slots correct", status: "accepted" },
  { label: "Wrong intent", status: "wrong_intent" },
  { label: "Wrong slots", status: "wrong_slots" },
  { label: "Should clarify", status: "should_clarify" },
  { label: "Should block", status: "should_block" },
  { label: "Not a command", status: "should_not_route" },
];

export function VoiceRegressionPanel({
  actions,
  sending,
  viewModel,
}: VoiceRegressionPanelProps) {
  const [drafts, setDrafts] = useState<Record<string, DraftFeedback>>({});
  const status = viewModel.status;
  const enabled = status?.consentLevel === "local_text";
  const pilotSession = status?.pilotSession;
  const canPreparePilot =
    enabled &&
    pilotSession?.sessionState === "inactive" &&
    viewModel.pendingSamples.length === 0 &&
    viewModel.records.length === 0 &&
    status?.pendingCount === 0 &&
    status.recordCount === 0 &&
    pilotSession.expectedProviderId !== undefined;
  const canCancelPilot =
    pilotSession?.sessionState === "ready" ||
    pilotSession?.sessionState === "collecting";
  const confirmEnable = () => {
    if (enabled) {
      actions.setRegressionLocalTextCollection(false);
      return;
    }
    const accepted = window.confirm(
      "Enable local text-only ASR regression collection? Raw ASR text, resolver candidates, minimal context, and your explicit feedback are stored only on this device. Audio and upload remain disabled.",
    );
    if (accepted) {
      actions.setRegressionLocalTextCollection(true);
    }
  };
  const confirmClear = () => {
    const accepted = window.confirm(
      "Delete all saved local ASR regression records from this device?",
    );
    if (accepted) {
      actions.clearRegressionRecords();
    }
  };
  const confirmPreparePilot = () => {
    if (!pilotSession) return;
    const accepted = window.confirm(
      [
        "Prepare Voice Pilot session?",
        `Manifest: ${pilotSession.manifestId ?? "unknown"}`,
        `Expected provider: ${pilotSession.expectedProviderId ?? "missing"}`,
        "The Voice Regression repository must be empty.",
        "Real Windows execution must remain disabled.",
        "Only local text collection is enabled.",
        "Audio is not saved.",
      ].join("\n"),
    );
    if (accepted) {
      actions.preparePilotSession();
    }
  };
  const confirmCancelPilot = () => {
    const accepted = window.confirm(
      "Cancel and invalidate the current Voice Pilot session? This does not delete records, clear the repository, or reset runtime audit counters.",
    );
    if (accepted) {
      actions.cancelPilotSession();
    }
  };
  const updateDraft = (sampleId: string, patch: Partial<DraftFeedback>) => {
    setDrafts((current) => ({
      ...current,
      [sampleId]: {
        ...(current[sampleId] ?? DEFAULT_DRAFT),
        ...patch,
      },
    }));
  };
  const saveSample = (sample: VoiceRegressionSample) => {
    const draft = drafts[sample.id] ?? DEFAULT_DRAFT;
    const feedback = createDualFeedback(draft);
    if (!feedback) return;
    const warning = feedbackConsistencyWarning(
      sample,
      feedback,
      status?.pilotSession?.currentPrompt,
    );
    if (warning && !draft.overrideFeedbackWarning) {
      updateDraft(sample.id, { overrideFeedbackWarning: true });
      return;
    }
    actions.saveRegressionPendingSample(sample.id, feedback, {
      overrideFeedbackWarning: draft.overrideFeedbackWarning,
    });
    setDrafts((current) => {
      const next = { ...current };
      delete next[sample.id];
      return next;
    });
  };

  return (
    <section className="mt-5 min-w-0 border-t pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">ASR regression</h3>
          <p className="text-xs text-muted-foreground">
            Local text only / audio unsupported / no upload
          </p>
        </div>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {enabled ? "LOCAL TEXT" : "OFF"}
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          className="h-8 rounded-md px-3 text-xs"
          disabled={sending}
          onClick={confirmEnable}
          type="button"
          variant={enabled ? "secondary" : "default"}
        >
          {enabled ? "Disable" : "Enable"}
        </Button>
        <Button
          aria-label="Refresh ASR regression records"
          className="size-8 rounded-md"
          disabled={sending}
          onClick={actions.refreshRegressionRecords}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-3.5" />
        </Button>
        <Button
          aria-label="Export ASR regression records"
          className="size-8 rounded-md"
          disabled={sending || viewModel.records.length === 0}
          onClick={actions.exportRegressionRecords}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Download className="size-3.5" />
        </Button>
        <Button
          aria-label="Clear ASR regression records"
          className="size-8 rounded-md"
          disabled={sending || viewModel.records.length === 0}
          onClick={confirmClear}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <dl className="mb-3 divide-y divide-border border-y text-[11px]">
        <MetricRow label="records" value={String(status?.recordCount ?? 0)} />
        <MetricRow label="pending" value={String(status?.pendingCount ?? 0)} />
        <MetricRow
          label="max records"
          value={String(status?.retentionMaxRecords ?? 0)}
        />
        <MetricRow
          label="max age"
          value={`${status?.retentionMaxAgeDays ?? 0} days`}
        />
        <MetricRow
          label="max file"
          value={formatBytes(status?.retentionMaxBytes ?? 0)}
        />
        <MetricRow
          label="file size"
          value={formatBytes(status?.retentionApproximateBytes ?? 0)}
        />
        <MetricRow
          label="last cleanup"
          value={formatTimestamp(status?.retentionLastAppliedAt)}
        />
        <MetricRow
          label="retention"
          value={status?.retentionPolicy ?? "local_text_30d_10000_records_5mb"}
        />
        <MetricRow
          label="audio"
          value={status?.localAudioConsentLevel ?? "unsupported"}
        />
        <MetricRow label="upload" value={status?.uploadAllowed ? "ON" : "OFF"} />
      </dl>
      {status?.pilotSession ? (
        <dl className="mb-3 divide-y divide-border border-y text-[11px]">
          <MetricRow
            label="pilot session"
            value={status.pilotSession.sessionState}
          />
          <MetricRow
            label="manifest"
            value={`${status.pilotSession.manifestId ?? "none"} / ${shortDigest(status.pilotSession.manifestDigest)}`}
          />
          <MetricRow
            label="progress"
            value={`${status.pilotSession.terminalPromptCount ?? 0}/${status.pilotSession.expectedPromptCount ?? 20}`}
          />
          <MetricRow
            label="current prompt"
            value={
              status.pilotSession.currentPrompt
                ? `${status.pilotSession.currentPrompt.promptId} ${status.pilotSession.currentPrompt.status}`
                : "none"
            }
          />
          <MetricRow
            label="prompt text"
            value={status.pilotSession.currentPrompt?.displayText ?? "none"}
          />
          <MetricRow
            label="manifest drift"
            value={`dup ${status.pilotSession.duplicatePromptCount ?? 0} / order ${status.pilotSession.outOfOrderAttemptCount ?? 0} / extra ${status.pilotSession.nonManifestRecordCount ?? 0}`}
          />
          <MetricRow
            label="prompt outcomes"
            value={`no-final ${status.pilotSession.noFinalTranscriptCount ?? 0} / discard ${status.pilotSession.discardedCount ?? 0} / deviation ${status.pilotSession.operatorDeviationCount ?? 0}`}
          />
          <MetricRow
            label="feedback warnings"
            value={`${status.pilotSession.feedbackWarningCount ?? 0} / overrides ${status.pilotSession.feedbackWarningOverrideCount ?? 0}`}
          />
          <MetricRow
            label="required context"
            value={
              status.pilotSession.requiredContext?.missing.length
                ? `missing ${status.pilotSession.requiredContext.missing.join(", ")}`
                : "ready"
            }
          />
          <MetricRow
            label="session id"
            value={status.pilotSession.sessionShortId ?? "none"}
          />
          <MetricRow
            label="expected provider"
            value={status.pilotSession.expectedProviderId ?? "missing"}
          />
          <MetricRow
            label="actual provider"
            value={
              status.pilotSession.sessionState === "inactive"
                ? `${status.pilotSession.actualProviderId} (not locked)`
                : status.pilotSession.actualProviderId
            }
          />
          <MetricRow
            label="provider match"
            value={formatProviderMatch(status.pilotSession)}
          />
          <MetricRow
            label="input mode"
            value={`${status.pilotSession.inputMode}/${status.pilotSession.inputModeSource}`}
          />
          <MetricRow
            label="executor delta"
            value={formatExecutorDelta(status.pilotSession)}
          />
          <MetricRow
            label="session valid"
            value={
              status.pilotSession.allowManualPilot
                ? "YES"
                : (status.pilotSession.invalidationReason ?? "NO")
            }
          />
          <MetricRow
            label="failure reason"
            value={status.pilotSession.invalidationReason ?? "none"}
          />
        </dl>
      ) : null}
      {status?.pilotSession ? (
        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            className="h-8 rounded-md px-3 text-xs"
            data-testid="voice-pilot-prepare"
            disabled={sending || !canPreparePilot}
            onClick={confirmPreparePilot}
            type="button"
            variant="outline"
          >
            Prepare Pilot Session
          </Button>
          <Button
            className="h-8 rounded-md px-3 text-xs"
            data-testid="voice-pilot-refresh-runtime"
            disabled={sending}
            onClick={actions.refreshRegressionRecords}
            type="button"
            variant="outline"
          >
            Refresh runtime preflight
          </Button>
          <Button
            className="h-8 rounded-md px-3 text-xs"
            data-testid="voice-pilot-start-prompt"
            disabled={
              sending ||
              !status.pilotSession.allowManualPilot ||
              status.pilotSession.currentPrompt?.status === "active" ||
              status.pilotSession.currentPrompt?.status ===
                "transcript_received"
            }
            onClick={actions.startPilotPrompt}
            type="button"
            variant="outline"
          >
            Start prompt
          </Button>
          <Button
            className="h-8 rounded-md px-3 text-xs"
            data-testid="voice-pilot-cancel"
            disabled={sending || !canCancelPilot}
            onClick={confirmCancelPilot}
            type="button"
            variant="ghost"
          >
            Cancel session
          </Button>
          <Button
            className="h-8 rounded-md px-3 text-xs"
            disabled={
              sending ||
              status.pilotSession.currentPrompt?.status !== "active"
            }
            onClick={actions.markPilotNoFinalTranscript}
            type="button"
            variant="outline"
          >
            No final
          </Button>
          <Button
            className="h-8 rounded-md px-3 text-xs"
            disabled={
              sending ||
              status.pilotSession.currentPrompt?.status !== "active"
            }
            onClick={() => {
              const accepted = window.confirm(
                "Mark this prompt as operator deviation and invalidate the strict Pilot session?",
              );
              if (accepted) actions.markPilotOperatorDeviation();
            }}
            type="button"
            variant="ghost"
          >
            Operator deviation
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {viewModel.pendingSamples.slice(0, 5).map((sample) => (
          <PendingSampleCard
            draft={drafts[sample.id] ?? DEFAULT_DRAFT}
            key={sample.id}
            onDiscard={() => actions.discardRegressionPendingSample(sample.id)}
            onSave={() => saveSample(sample)}
            onUpdate={(patch) => updateDraft(sample.id, patch)}
            pilotPrompt={status?.pilotSession?.currentPrompt}
            sample={sample}
            sending={sending}
          />
        ))}

        {viewModel.records.slice(0, 5).map((record) => (
          <RecordCard
            key={record.id}
            onDelete={() => actions.deleteRegressionRecord(record.id)}
            onMarkAbandoned={() =>
              actions.submitRegressionFeedback(record.id, {
                kind: "dual_layer",
                transcript: { status: "rejected" },
                resolution: { status: "not_applicable" },
              })
            }
            record={record}
            sending={sending}
          />
        ))}
      </div>

      {viewModel.exportText ? (
        <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap border-t pt-3 text-[11px] text-muted-foreground">
          {viewModel.exportText}
        </pre>
      ) : null}
    </section>
  );
}

function PendingSampleCard({
  draft,
  onDiscard,
  onSave,
  onUpdate,
  pilotPrompt,
  sample,
  sending,
}: {
  draft: DraftFeedback;
  onDiscard(): void;
  onSave(): void;
  onUpdate(patch: Partial<DraftFeedback>): void;
  pilotPrompt:
    | NonNullable<VoiceRegressionCollectionStatus["pilotSession"]>["currentPrompt"]
    | undefined;
  sample: VoiceRegressionSample;
  sending: boolean;
}) {
  const saveEnabled = useMemo(() => isDraftComplete(draft), [draft]);
  const resolutionStatus =
    draft.transcriptStatus === "rejected"
      ? "not_applicable"
      : draft.resolutionStatus;
  const feedback = createDualFeedback(draft);
  const warning = feedback
    ? feedbackConsistencyWarning(sample, feedback, pilotPrompt)
    : undefined;

  return (
    <article
      className="border-t pt-3 text-xs"
      data-testid="voice-regression-pending-sample"
    >
      <div className="mb-2 min-w-0">
        <p className="truncate font-semibold">{sample.asr.rawTranscript}</p>
        <p className="truncate text-muted-foreground">
          {sample.resolver.normalizedText}
        </p>
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge className="rounded-md text-[10px]" variant="outline">
          PENDING
        </Badge>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {sample.resolver.outcomeClass}
        </Badge>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {sample.resolver.blocked ? "blocked" : "not blocked"}
        </Badge>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {sample.resolver.clarificationRequired ? "clarify" : "no clarify"}
        </Badge>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {sample.privacy.containsAudio ? "AUDIO" : "TEXT"}
        </Badge>
        {sample.pilot ? (
          <Badge className="rounded-md text-[10px]" variant="outline">
            {sample.pilot.promptId}/{sample.pilot.ordinal}
          </Badge>
        ) : null}
      </div>
      <CandidateSummary sample={sample} />

      <fieldset className="mt-3 space-y-2">
        <legend className="text-[11px] font-semibold">
          Is the voice transcript correct?
        </legend>
        <div className="flex flex-wrap gap-2">
          <ChoiceButton
            active={draft.transcriptStatus === "accepted"}
            disabled={sending}
            label="Correct"
            onClick={() =>
              onUpdate({
                correctedText: "",
                resolutionStatus:
                  draft.resolutionStatus === "not_applicable"
                    ? "unreviewed"
                    : draft.resolutionStatus,
                transcriptStatus: "accepted",
              })
            }
          />
          <ChoiceButton
            active={draft.transcriptStatus === "corrected"}
            disabled={sending}
            label="Correct text"
            onClick={() => onUpdate({ transcriptStatus: "corrected" })}
          />
          <ChoiceButton
            active={draft.transcriptStatus === "rejected"}
            disabled={sending}
            label="Unusable"
            onClick={() =>
              onUpdate({
                correctedText: "",
                resolutionStatus: "not_applicable",
                transcriptStatus: "rejected",
              })
            }
          />
        </div>
        {draft.transcriptStatus === "corrected" ? (
          <textarea
            aria-label="Corrected transcript"
            className="min-h-16 w-full resize-y rounded-md border bg-background px-2 py-2 text-xs"
            disabled={sending}
            maxLength={500}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              onUpdate({ correctedText: event.currentTarget.value })
            }
            onKeyDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            placeholder="Correct transcript"
            rows={2}
            value={draft.correctedText}
          />
        ) : null}
      </fieldset>

      <fieldset className="mt-3 space-y-2">
        <legend className="text-[11px] font-semibold">
          Did Jarvis understand the command correctly?
        </legend>
        {draft.transcriptStatus === "rejected" ? (
          <Badge className="rounded-md text-[10px]" variant="outline">
            resolution: not_applicable
          </Badge>
        ) : (
          <div className="flex flex-wrap gap-2">
            {RESOLUTION_OPTIONS.map((option) => (
              <ChoiceButton
                active={resolutionStatus === option.status}
                disabled={sending}
                key={option.status}
                label={option.label}
                onClick={() => onUpdate({ resolutionStatus: option.status })}
              />
            ))}
          </div>
        )}
      </fieldset>

      {warning ? (
        <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-2 py-2 text-[11px] text-amber-900">
          {feedbackWarningCopy(warning)}
          {draft.overrideFeedbackWarning
            ? " Click Save feedback again to confirm this override."
            : " Save feedback now shows this warning first."}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          className="h-7 rounded-md px-2 text-[11px]"
          disabled={sending || !saveEnabled}
          onClick={onSave}
          type="button"
          variant="outline"
        >
          {warning && draft.overrideFeedbackWarning
            ? "Confirm save"
            : "Save feedback"}
        </Button>
        <Button
          className="h-7 rounded-md px-2 text-[11px]"
          disabled={sending}
          onClick={onDiscard}
          type="button"
          variant="ghost"
        >
          Discard
        </Button>
      </div>
    </article>
  );
}

function RecordCard({
  onDelete,
  onMarkAbandoned,
  record,
  sending,
}: {
  onDelete(): void;
  onMarkAbandoned(): void;
  record: VoiceRegressionRecord;
  sending: boolean;
}) {
  return (
    <article
      className="border-t pt-3 text-xs"
      data-testid="voice-regression-record"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{record.asr.rawTranscript}</p>
          <p className="truncate text-muted-foreground">
            {record.resolver.normalizedText}
          </p>
        </div>
        <Button
          aria-label="Delete ASR regression record"
          className="size-8 shrink-0 rounded-md"
          disabled={sending}
          onClick={onDelete}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge className="rounded-md text-[10px]" variant="outline">
          {record.resolver.outcomeClass}
        </Badge>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {feedbackSummary(record)}
        </Badge>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {record.privacy.containsAudio ? "AUDIO" : "TEXT"}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          className="h-7 rounded-md px-2 text-[11px]"
          disabled={sending}
          onClick={onMarkAbandoned}
          type="button"
          variant="ghost"
        >
          Mark unusable
        </Button>
      </div>
    </article>
  );
}

function CandidateSummary({ sample }: { sample: VoiceRegressionSample }) {
  const candidate = sample.resolver.candidates[0];
  if (!candidate) {
    return (
      <p className="text-[11px] text-muted-foreground">
        candidate: none / slots: none
      </p>
    );
  }
  return (
    <p className="truncate text-[11px] text-muted-foreground">
      candidate: {candidate.intent} / slots: {JSON.stringify(candidate.safeSlots)}
    </p>
  );
}

function ChoiceButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick(): void;
}) {
  return (
    <Button
      className="h-7 rounded-md px-2 text-[11px]"
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={active ? "default" : "outline"}
    >
      {label}
    </Button>
  );
}

function createDualFeedback(
  draft: DraftFeedback,
): VoiceRegressionDualFeedback | undefined {
  if (!isDraftComplete(draft)) return undefined;
  return {
    kind: "dual_layer",
    transcript: {
      status: draft.transcriptStatus,
      ...(draft.transcriptStatus === "corrected"
        ? { correctedText: draft.correctedText.trim() }
        : {}),
    },
    resolution: {
      status:
        draft.transcriptStatus === "rejected"
          ? "not_applicable"
          : draft.resolutionStatus,
    },
  };
}

function isDraftComplete(draft: DraftFeedback): boolean {
  if (draft.transcriptStatus === "unreviewed") return false;
  if (
    draft.transcriptStatus === "corrected" &&
    draft.correctedText.trim().length === 0
  ) {
    return false;
  }
  if (draft.transcriptStatus === "rejected") return true;
  return draft.resolutionStatus !== "unreviewed";
}

function feedbackSummary(record: VoiceRegressionRecord): string {
  if (record.feedback.kind === "legacy_combined") {
    return `legacy:${record.feedback.status}`;
  }
  return `${record.feedback.transcript.status}/${record.feedback.resolution.status}`;
}

function feedbackConsistencyWarning(
  sample: VoiceRegressionSample,
  feedback: VoiceRegressionDualFeedback,
  pilotPrompt:
    | NonNullable<VoiceRegressionCollectionStatus["pilotSession"]>["currentPrompt"]
    | undefined,
): FeedbackWarning | undefined {
  if (!pilotPrompt || feedback.transcript.status === "rejected") {
    return undefined;
  }
  if (
    feedback.resolution.status === "accepted" &&
    (sample.resolver.outcomeClass === "no_candidate" ||
      sample.resolver.outcomeClass === "clarification") &&
    pilotPrompt.expectedIntent !== undefined
  ) {
    return "accepted_resolution_without_candidate";
  }
  const topIntent = sample.resolver.candidates[0]?.intent;
  if (
    feedback.resolution.status === "wrong_intent" &&
    pilotPrompt.expectedIntent !== undefined &&
    topIntent === pilotPrompt.expectedIntent
  ) {
    return "expected_intent_matched_prefer_wrong_slots";
  }
  if (
    feedback.resolution.status === "accepted" &&
    pilotPrompt.expectedOutcomeClass === "blocked" &&
    !sample.resolver.blocked
  ) {
    return "dangerous_prompt_should_block";
  }
  if (
    feedback.resolution.status === "accepted" &&
    pilotPrompt.safetyClass === "negative_or_quoted" &&
    sample.resolver.candidates.length > 0
  ) {
    return "negative_prompt_should_not_route";
  }
  return undefined;
}

function feedbackWarningCopy(warning: FeedbackWarning): string {
  switch (warning) {
    case "accepted_resolution_without_candidate":
      return "Check this label: Accept means Jarvis fully understood the intent and key slots, not only that it produced a response.";
    case "expected_intent_matched_prefer_wrong_slots":
      return "The expected intent appears to match. If the target or parameters are wrong, prefer Wrong slots over Wrong intent.";
    case "dangerous_prompt_should_block":
      return "This prompt is expected to be safely blocked. If it was not blocked, use Should block.";
    case "negative_prompt_should_not_route":
      return "This negative or quoted prompt should not become an executable command. If it routed, use Not a command.";
  }
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(value: string | undefined): string {
  if (!value) {
    return "not applied";
  }
  return new Date(value).toLocaleString();
}

function shortDigest(value: string | undefined): string {
  return value ? value.slice(0, 8) : "none";
}

function formatExecutorDelta(
  pilotSession: NonNullable<
    VoiceRegressionCollectionStatus["pilotSession"]
  >,
): string {
  const baseline =
    pilotSession.auditBaseline?.windowsExecutorInvocationCount ?? 0;
  const current = pilotSession.auditCurrent?.windowsExecutorInvocationCount ?? 0;
  return String(Math.max(0, current - baseline));
}

function formatProviderMatch(
  pilotSession: NonNullable<
    VoiceRegressionCollectionStatus["pilotSession"]
  >,
): string {
  if (pilotSession.sessionState === "inactive") {
    return "N/A";
  }
  return pilotSession.providerMatchesExpected ? "YES" : "NO";
}
