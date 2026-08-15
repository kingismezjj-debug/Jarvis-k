import { Mic2, MicOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { VoiceCaptureViewModel, VoiceControlCopy } from "./types";

export type VoiceTranscriptPanelProps = {
  copy: VoiceControlCopy;
  onStart(): void;
  onStop(reason: "release" | "user-cancel"): void;
  viewModel: VoiceCaptureViewModel;
};

export function VoiceTranscriptPanel({
  copy,
  onStart,
  onStop,
  viewModel,
}: VoiceTranscriptPanelProps) {
  return (
    <div className="rounded-md border bg-card px-4 py-4">
      <div className="flex items-center gap-3">
        <Button
          aria-label="Push to talk from voice view"
          aria-pressed={viewModel.active}
          className={cn(
            "size-11 rounded-md",
            viewModel.active && "bg-destructive text-destructive-foreground",
          )}
          data-testid="voice-view-push-to-talk"
          disabled={!viewModel.coreOnline || viewModel.textOnlyAcceptanceMode}
          onContextMenu={(event) => event.preventDefault()}
          onPointerCancel={() => {
            if (viewModel.textOnlyAcceptanceMode) return;
            onStop("user-cancel");
          }}
          onPointerDown={(event) => {
            if (viewModel.textOnlyAcceptanceMode) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            onStart();
          }}
          onPointerUp={(event) => {
            if (viewModel.textOnlyAcceptanceMode) return;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            onStop("release");
          }}
          size="icon-lg"
          type="button"
          variant={viewModel.active ? "default" : "outline"}
        >
          {viewModel.textOnlyAcceptanceMode ? (
            <MicOff className="size-4" />
          ) : (
            <Mic2 className="size-4" />
          )}
        </Button>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {viewModel.mode} / {viewModel.state}
          </p>
          <p className="mt-1 truncate text-sm">
            {viewModel.transcript || copy.label.noTranscript}
          </p>
          {viewModel.languageMismatch && (
            <p
              className="mt-1 text-[11px] leading-4 text-warning"
              data-testid="voice-language-warning"
            >
              {copy.label.voiceLanguageMismatch}
            </p>
          )}
          {viewModel.captureNotice && (
            <p
              className="mt-1 text-[11px] leading-4 text-warning"
              data-testid="voice-capture-notice"
            >
              {viewModel.captureNotice}
            </p>
          )}
          {viewModel.captureErrorDetail && (
            <p
              className="mt-1 text-[11px] leading-4 text-muted-foreground"
              data-testid="voice-capture-error-detail"
            >
              {viewModel.captureErrorDetail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VoicePermissionBadge({
  permission,
}: {
  permission: string;
}) {
  return (
    <Badge className="rounded-md text-[10px]" variant="outline">
      {permission}
    </Badge>
  );
}
