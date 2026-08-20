import { PanelLeft, RefreshCw } from "lucide-react";
import type { DesktopCloseButtonBehavior } from "@jarvis-k/contracts";

import type { stage5Copy, uiCopy } from "@/app/copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];
type AlphaCopy = (typeof stage5Copy)["en"];

export type SettingsGeneralViewModel = {
  connection: string;
  coreHealth: string;
  inspectorOpen: boolean;
  localTtsEnabled: boolean;
  runtimeMode: string;
  sending: boolean;
  sequenceId: number;
  ttsServiceConfigured: boolean;
  developerModeEnabled: boolean;
  desktopCloseButtonBehavior: DesktopCloseButtonBehavior;
  evaluationCapabilityAvailable: boolean;
  showDeveloperControls: boolean;
};

export type SettingsGeneralActions = {
  probeCore: () => void;
  setLocalTtsEnabled: (enabled: boolean) => void;
  setDeveloperModeEnabled: (enabled: boolean) => void;
  setDesktopCloseButtonBehavior: (
    behavior: DesktopCloseButtonBehavior,
  ) => void;
  toggleInspector: () => void;
};

export function SettingsGeneralPanel({
  actions,
  alphaCopy,
  copy,
  viewModel,
}: {
  actions: SettingsGeneralActions;
  alphaCopy: AlphaCopy;
  copy: Copy;
  viewModel: SettingsGeneralViewModel;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{copy.settings.general}</h3>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {copy.label.local}
        </Badge>
      </div>
      <dl className="divide-y divide-border border-y text-[11px]">
        <Metric
          label={copy.metric.coreHealth}
          tone="success"
          value={viewModel.coreHealth || viewModel.connection}
        />
        <Metric
          label={copy.metric.runtimeMode}
          tone="accent"
          value={viewModel.runtimeMode}
        />
        <Metric label={copy.metric.transport} tone="accent" value="IPC" />
        <Metric
          label={copy.metric.inspector}
          value={
            viewModel.inspectorOpen ? copy.value.shown : copy.value.hidden
          }
        />
        <Metric
          label={copy.metric.sequence}
          value={String(viewModel.sequenceId).padStart(4, "0")}
        />
        <Metric
          label={copy.label.ttsService}
          tone={viewModel.ttsServiceConfigured ? "success" : "warning"}
          value={
            viewModel.ttsServiceConfigured
              ? copy.label.voiceServiceConfigured
              : copy.label.voiceServiceMissing
          }
        />
      </dl>
      <label className="mt-3 flex items-center justify-between gap-3 border-y py-2 text-[11px]">
        <span className="min-w-0">
          <span className="block font-medium">{alphaCopy.tts}</span>
          <span className="mt-0.5 block text-muted-foreground">
            {viewModel.localTtsEnabled
              ? alphaCopy.ttsEnabled
              : alphaCopy.ttsDisabled}
          </span>
        </span>
        <input
          aria-label={alphaCopy.tts}
          checked={viewModel.localTtsEnabled}
          className="size-4 accent-primary"
          data-testid="settings-local-tts-toggle"
          onChange={(event) => actions.setLocalTtsEnabled(event.target.checked)}
          type="checkbox"
        />
      </label>
      <div
        className="mt-3 border-y py-2 text-[11px]"
        data-testid="settings-close-button-behavior"
      >
        <div className="mb-2 font-medium">Close button behavior</div>
        <div className="flex flex-wrap gap-2">
          <Button
            aria-pressed={
              viewModel.desktopCloseButtonBehavior === "minimize_to_tray"
            }
            className="h-8 rounded-md px-2.5 text-xs"
            data-testid="settings-close-behavior-tray"
            onClick={() =>
              actions.setDesktopCloseButtonBehavior("minimize_to_tray")
            }
            type="button"
            variant={
              viewModel.desktopCloseButtonBehavior === "minimize_to_tray"
                ? "secondary"
                : "outline"
            }
          >
            Minimize to system tray
          </Button>
          <Button
            aria-pressed={viewModel.desktopCloseButtonBehavior === "quit"}
            className="h-8 rounded-md px-2.5 text-xs"
            data-testid="settings-close-behavior-quit"
            onClick={() => actions.setDesktopCloseButtonBehavior("quit")}
            type="button"
            variant={
              viewModel.desktopCloseButtonBehavior === "quit"
                ? "secondary"
                : "outline"
            }
          >
            Quit Jarvis-K
          </Button>
        </div>
        <Metric
          label="Persistence"
          tone="accent"
          value="local only"
        />
      </div>
      <div
        className="mt-3 border-y py-2 text-[11px]"
        data-testid="settings-developer-mode"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block font-medium">
              {copy.label.developerMode}
            </span>
            <span className="mt-0.5 block text-muted-foreground">
              {viewModel.developerModeEnabled
                ? "Developer diagnostics are visible."
                : "Product mode hides diagnostics and evaluation tools."}
            </span>
          </span>
          <input
            aria-label={copy.label.developerMode}
            checked={viewModel.developerModeEnabled}
            className="size-4 accent-primary"
            data-testid="settings-developer-mode-toggle"
            onChange={(event) =>
              actions.setDeveloperModeEnabled(event.target.checked)
            }
            type="checkbox"
          />
        </div>
        <Metric
          label={copy.label.evaluationCapability}
          tone={viewModel.evaluationCapabilityAvailable ? "accent" : undefined}
          value={viewModel.evaluationCapabilityAvailable ? "available" : "off"}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {viewModel.showDeveloperControls ? (
          <>
            <Button
              className="h-8 rounded-md px-2.5 text-xs"
              data-testid="settings-toggle-inspector"
              onClick={actions.toggleInspector}
              type="button"
              variant="outline"
            >
              <PanelLeft className="size-3.5" />
              {copy.label.inspector}
            </Button>
            <Button
              className="h-8 rounded-md px-2.5 text-xs"
              data-testid="settings-probe-core"
              disabled={viewModel.sending}
              onClick={actions.probeCore}
              type="button"
              variant="outline"
            >
              <RefreshCw
                className={cn("size-3.5", viewModel.sending && "animate-spin")}
              />
              {copy.label.probe}
            </Button>
          </>
        ) : null}
      </div>
    </section>
  );
}
