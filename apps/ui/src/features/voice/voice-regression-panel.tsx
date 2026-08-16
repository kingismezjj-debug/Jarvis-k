import { Download, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type {
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
    | "clearRegressionPendingSamples"
    | "clearRegressionRecords"
    | "discardRegressionPendingSample"
    | "deleteRegressionRecord"
    | "exportRegressionRecords"
    | "refreshRegressionRecords"
    | "saveRegressionPendingSample"
    | "setRegressionLocalTextCollection"
    | "submitRegressionFeedback"
  >;
  sending: boolean;
  viewModel: VoiceRegressionViewModel;
};

type DraftFeedback = {
  correctedText: string;
  resolutionStatus: VoiceRegressionResolutionFeedbackStatus;
  transcriptStatus: VoiceRegressionTranscriptFeedbackStatus;
};

const DEFAULT_DRAFT: DraftFeedback = {
  correctedText: "",
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
    actions.saveRegressionPendingSample(sample.id, feedback);
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

      <div className="space-y-3">
        {viewModel.pendingSamples.slice(0, 5).map((sample) => (
          <PendingSampleCard
            draft={drafts[sample.id] ?? DEFAULT_DRAFT}
            key={sample.id}
            onDiscard={() => actions.discardRegressionPendingSample(sample.id)}
            onSave={() => saveSample(sample)}
            onUpdate={(patch) => updateDraft(sample.id, patch)}
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
  sample,
  sending,
}: {
  draft: DraftFeedback;
  onDiscard(): void;
  onSave(): void;
  onUpdate(patch: Partial<DraftFeedback>): void;
  sample: VoiceRegressionSample;
  sending: boolean;
}) {
  const saveEnabled = useMemo(() => isDraftComplete(draft), [draft]);
  const resolutionStatus =
    draft.transcriptStatus === "rejected"
      ? "not_applicable"
      : draft.resolutionStatus;

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
          <input
            aria-label="Corrected transcript"
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            maxLength={500}
            onChange={(event) =>
              onUpdate({ correctedText: event.currentTarget.value })
            }
            placeholder="Correct transcript"
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

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          className="h-7 rounded-md px-2 text-[11px]"
          disabled={sending || !saveEnabled}
          onClick={onSave}
          type="button"
          variant="outline"
        >
          Save feedback
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
