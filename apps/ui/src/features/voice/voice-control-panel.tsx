import { ScrollArea } from "@/components/ui/scroll-area";

import type { VoiceCaptureActions, VoiceControlViewModel } from "./types";
import { VoiceAliasConfirmation } from "./voice-alias-confirmation";
import { VoiceCaptureControls } from "./voice-capture-controls";
import { VoiceRegressionPanel } from "./voice-regression-panel";
import { VoiceStatus } from "./voice-status";

export type VoiceControlPanelProps = {
  actions: VoiceCaptureActions;
  viewModel: VoiceControlViewModel;
};

export function VoiceControlPanel({
  actions,
  viewModel,
}: VoiceControlPanelProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div
        className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_320px]"
        data-testid="voice-view"
      >
        <section className="min-w-0">
          <VoiceCaptureControls
            actions={{
              startCapture: actions.startCapture,
              stopCapture: actions.stopCapture,
            }}
            copy={viewModel.copy}
            viewModel={viewModel.capture}
          />
          <VoiceAliasConfirmation
            actions={{
              refreshRouteAliases: actions.refreshRouteAliases,
              refreshVoiceAliases: actions.refreshVoiceAliases,
              removeRouteAlias: actions.removeRouteAlias,
              removeVoiceAlias: actions.removeVoiceAlias,
            }}
            copy={viewModel.copy}
            sending={viewModel.sending}
            viewModel={viewModel.aliases}
          />
        </section>

        <aside className="min-w-0">
          <VoiceStatus
            actions={{ openSettings: actions.openSettings }}
            copy={viewModel.copy}
            viewModel={viewModel.status}
          />
          <VoiceRegressionPanel
            actions={{
              clearRegressionPendingSamples:
                actions.clearRegressionPendingSamples,
              clearRegressionRecords: actions.clearRegressionRecords,
              discardRegressionPendingSample:
                actions.discardRegressionPendingSample,
              markPilotNoFinalTranscript: actions.markPilotNoFinalTranscript,
              markPilotOperatorDeviation: actions.markPilotOperatorDeviation,
              deleteRegressionRecord: actions.deleteRegressionRecord,
              exportRegressionRecords: actions.exportRegressionRecords,
              refreshRegressionRecords: actions.refreshRegressionRecords,
              saveRegressionPendingSample: actions.saveRegressionPendingSample,
              startPilotPrompt: actions.startPilotPrompt,
              setRegressionLocalTextCollection:
                actions.setRegressionLocalTextCollection,
              submitRegressionFeedback: actions.submitRegressionFeedback,
            }}
            sending={viewModel.sending}
            viewModel={viewModel.regression}
          />
        </aside>
      </div>
    </ScrollArea>
  );
}
