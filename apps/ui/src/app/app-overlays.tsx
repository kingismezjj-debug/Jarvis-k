import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ActiveView } from "./types";

export type CommandRouterLocalAppLaunchOverlayProps = {
  activeView: ActiveView;
  eligible: boolean;
  result?: {
    label: string;
    reasonCode: string;
    status: string;
  } | null;
  sending: boolean;
  target: string | null;
  onConfirm: () => void;
};

export function CommandRouterLocalAppLaunchOverlay({
  activeView,
  eligible,
  onConfirm,
  result,
  sending,
  target,
}: CommandRouterLocalAppLaunchOverlayProps) {
  if (activeView !== "conversation" || (!eligible && !result)) {
    return null;
  }

  return (
    <div
      className="shrink-0 border-t bg-card px-6 py-3"
      data-testid="command-router-real-local-app-launch"
    >
      <div className="flex flex-wrap items-center gap-2">
        {eligible && (
          <Button
            aria-label={`Confirm launch ${target}`}
            className="h-8 rounded-md px-2.5 text-xs"
            data-testid="confirm-command-router-local-app-launch"
            disabled={sending}
            onClick={onConfirm}
            type="button"
            variant="secondary"
          >
            <ExternalLink className="size-3.5" />
            Confirm launch {target}
          </Button>
        )}
        <span className="text-[10px] leading-4 text-muted-foreground">
          Low-risk known apps run through Task Runtime with visible status; unclear targets still require confirmation.
        </span>
      </div>
      {result && (
        <p
          className="mt-2 text-[11px] leading-5 text-muted-foreground"
          data-testid="command-router-local-app-launch-result"
        >
          Real launch: {result.status} / {result.label} / {result.reasonCode}
        </p>
      )}
    </div>
  );
}
