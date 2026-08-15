import type {
  VoiceCaptureActions,
  VoiceCaptureViewModel,
  VoiceControlCopy,
} from "./types";
import {
  VoicePermissionBadge,
  VoiceTranscriptPanel,
} from "./voice-transcript-panel";

export type VoiceCaptureControlsProps = {
  actions: Pick<VoiceCaptureActions, "startCapture" | "stopCapture">;
  copy: VoiceControlCopy;
  viewModel: VoiceCaptureViewModel;
};

export function VoiceCaptureControls({
  actions,
  copy,
  viewModel,
}: VoiceCaptureControlsProps) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Voice</h3>
        <VoicePermissionBadge permission={viewModel.permission} />
      </div>
      <VoiceTranscriptPanel
        copy={copy}
        onStart={actions.startCapture}
        onStop={actions.stopCapture}
        viewModel={viewModel}
      />
    </section>
  );
}
