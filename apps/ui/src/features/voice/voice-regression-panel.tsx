import { Download, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { VoiceCaptureActions, VoiceRegressionViewModel } from "./types";

export type VoiceRegressionPanelProps = {
  actions: Pick<
    VoiceCaptureActions,
    | "clearRegressionRecords"
    | "deleteRegressionRecord"
    | "exportRegressionRecords"
    | "refreshRegressionRecords"
    | "setRegressionLocalTextCollection"
    | "submitRegressionFeedback"
  >;
  sending: boolean;
  viewModel: VoiceRegressionViewModel;
};

export function VoiceRegressionPanel({
  actions,
  sending,
  viewModel,
}: VoiceRegressionPanelProps) {
  const status = viewModel.status;
  const enabled = status?.consentLevel === "local_text";

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
          onClick={() => actions.setRegressionLocalTextCollection(!enabled)}
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
          onClick={actions.clearRegressionRecords}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <dl className="mb-3 divide-y divide-border border-y text-[11px]">
        <MetricRow label="records" value={String(status?.recordCount ?? 0)} />
        <MetricRow
          label="retention"
          value={status?.retentionPolicy ?? "user_managed"}
        />
        <MetricRow
          label="audio"
          value={status?.localAudioConsentLevel ?? "unsupported"}
        />
        <MetricRow label="upload" value={status?.uploadAllowed ? "ON" : "OFF"} />
      </dl>

      <div className="space-y-3">
        {viewModel.records.slice(0, 5).map((record) => (
          <article
            className="border-t pt-3 text-xs"
            key={record.id}
            data-testid="voice-regression-record"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {record.asr.rawTranscript}
                </p>
                <p className="truncate text-muted-foreground">
                  {record.resolver.normalizedText}
                </p>
              </div>
              <Button
                aria-label="Delete ASR regression record"
                className="size-8 shrink-0 rounded-md"
                disabled={sending}
                onClick={() => actions.deleteRegressionRecord(record.id)}
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
                {record.feedback.status}
              </Badge>
              <Badge className="rounded-md text-[10px]" variant="outline">
                {record.privacy.containsAudio ? "AUDIO" : "TEXT"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                className="h-7 rounded-md px-2 text-[11px]"
                disabled={sending}
                onClick={() =>
                  actions.submitRegressionFeedback(record.id, "accepted")
                }
                type="button"
                variant="outline"
              >
                Accept
              </Button>
              <Button
                className="h-7 rounded-md px-2 text-[11px]"
                disabled={sending}
                onClick={() =>
                  actions.submitRegressionFeedback(record.id, "rejected")
                }
                type="button"
                variant="outline"
              >
                Reject
              </Button>
              <Button
                className="h-7 rounded-md px-2 text-[11px]"
                disabled={sending}
                onClick={() =>
                  actions.submitRegressionFeedback(record.id, "abandoned")
                }
                type="button"
                variant="ghost"
              >
                Abandon
              </Button>
            </div>
          </article>
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

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
