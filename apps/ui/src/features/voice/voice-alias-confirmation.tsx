import { RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatVoiceCorrectionSlots } from "@/app/formatters";

import type {
  VoiceAliasViewModel,
  VoiceCaptureActions,
  VoiceControlCopy,
} from "./types";

export type VoiceAliasConfirmationProps = {
  actions: Pick<
    VoiceCaptureActions,
    | "refreshRouteAliases"
    | "refreshVoiceAliases"
    | "removeRouteAlias"
    | "removeVoiceAlias"
  >;
  copy: VoiceControlCopy;
  sending: boolean;
  viewModel: VoiceAliasViewModel;
};

export function VoiceAliasConfirmation({
  actions,
  sending,
  viewModel,
}: VoiceAliasConfirmationProps) {
  return (
    <>
      <div
        className="mt-5 rounded-md border bg-card px-4 py-4"
        data-testid="voice-command-aliases"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Voice command aliases</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {viewModel.voiceAliases.length} saved
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Refresh voice command aliases"
                className="size-8 rounded-md"
                data-testid="voice-command-alias-refresh"
                onClick={actions.refreshVoiceAliases}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh aliases</TooltipContent>
          </Tooltip>
        </div>
        {viewModel.voiceAliases.length > 0 ? (
          <div className="divide-y divide-border border-y">
            {viewModel.voiceAliases.map((alias) => (
              <div
                className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                data-testid="voice-command-alias"
                key={alias.id}
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-xs font-semibold"
                    data-testid="voice-command-alias-raw"
                  >
                    {alias.rawAlias}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {alias.intent} / {formatVoiceCorrectionSlots(alias.slots)}
                  </p>
                  <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                    {alias.confirmedAt}
                  </p>
                </div>
                <Button
                  className="h-8 rounded-md px-2 text-[11px]"
                  data-testid="voice-command-alias-delete"
                  disabled={sending}
                  onClick={() => actions.removeVoiceAlias(alias.id)}
                  type="button"
                  variant="outline"
                >
                  <Trash2 className="mr-1.5 size-3" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p
            className="border-t pt-3 text-xs text-muted-foreground"
            data-testid="voice-command-alias-empty"
          >
            No confirmed voice aliases yet.
          </p>
        )}
      </div>

      <div
        className="mt-5 rounded-md border bg-card px-4 py-4"
        data-testid="user-route-aliases"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">User route aliases</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {viewModel.routeAliases.length} saved
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Refresh user route aliases"
                className="size-8 rounded-md"
                data-testid="user-route-alias-refresh"
                onClick={actions.refreshRouteAliases}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh route aliases</TooltipContent>
          </Tooltip>
        </div>
        {viewModel.routeAliases.length > 0 ? (
          <div className="divide-y divide-border border-y">
            {viewModel.routeAliases.map((alias) => (
              <div
                className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                data-testid="user-route-alias"
                key={alias.id}
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-xs font-semibold"
                    data-testid="user-route-alias-label"
                  >
                    {alias.label}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {alias.intent} / {alias.targetHostname}
                  </p>
                  <p
                    className="mt-1 truncate text-[11px] text-muted-foreground"
                    data-testid="user-route-alias-url"
                  >
                    {alias.targetUrl}
                  </p>
                </div>
                <Button
                  className="h-8 rounded-md px-2 text-[11px]"
                  data-testid="user-route-alias-delete"
                  disabled={sending}
                  onClick={() => actions.removeRouteAlias(alias.id)}
                  type="button"
                  variant="outline"
                >
                  <Trash2 className="mr-1.5 size-3" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p
            className="border-t pt-3 text-xs text-muted-foreground"
            data-testid="user-route-alias-empty"
          >
            No confirmed route aliases yet.
          </p>
        )}
      </div>
    </>
  );
}
