import type { ReactNode } from "react";
import { MicOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConversationCopy } from "@/features/conversation/types";
import type { ActionStatus } from "./types";

export type AppBrandHeaderProps = {
  connection: string;
  copy: ConversationCopy;
  coreOnline: boolean;
};

export function AppBrandHeader({
  connection,
  copy,
  coreOnline,
}: AppBrandHeaderProps) {
  const normalizedConnection =
    connection === "online" || connection === "offline" || connection === "connecting"
      ? connection
      : "offline";
  const visibleConnection = copy.connection[normalizedConnection];
  const legacyConnectionLabel = connection.toUpperCase();
  const shouldExposeLegacyConnectionLabel =
    visibleConnection !== legacyConnectionLabel;

  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between gap-3 border-b bg-card px-5 max-[640px]:px-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          JK
        </div>
        <div className="min-w-0">
          <h1 className="text-[21px] font-bold leading-6">JARVIS-K</h1>
          <p className="text-[11px] leading-4 text-muted-foreground">
            {copy.appSubtitle}
          </p>
        </div>
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <Badge className="h-7 rounded-md px-2.5 text-[11px] max-[520px]:hidden" variant="secondary">
          {copy.label.protocol}
        </Badge>
        <Badge
          className="h-7 rounded-md border-border px-2.5 text-[11px]"
          data-testid="core-status"
          variant="outline"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              coreOnline ? "bg-success" : "bg-warning",
            )}
          />
          <span>{visibleConnection}</span>
          {shouldExposeLegacyConnectionLabel ? (
            <span className="sr-only">{legacyConnectionLabel}</span>
          ) : null}
        </Badge>
      </div>
    </header>
  );
}

export function AppTextOnlyBanner({ copy }: { copy: ConversationCopy }) {
  return (
    <div
      className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted px-5 text-xs text-muted-foreground"
      data-testid="text-only-acceptance-status"
      role="status"
    >
      <MicOff className="size-3.5" />
      {copy.label.textOnlyAcceptance}
    </div>
  );
}

export type AppViewHeaderProps = {
  actions: ReactNode;
  localContractLabel: string;
  lastAction: ActionStatus | null;
  subtitle: string;
  title: string;
};

export function AppViewHeader({
  actions,
  localContractLabel,
  lastAction,
  subtitle,
  title,
}: AppViewHeaderProps) {
  return (
    <div className="flex h-[70px] shrink-0 items-center justify-between gap-3 border-b px-7 max-[640px]:px-4">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2">
        {lastAction && (
          <Badge
            className={cn(
              "max-w-[260px] truncate rounded-md text-[10px] max-[760px]:max-w-[150px]",
              lastAction.tone === "success" && "text-success",
              lastAction.tone === "warning" && "text-warning",
              lastAction.tone === "accent" && "text-accent",
            )}
            data-testid="last-action-status"
            variant="outline"
          >
            {lastAction.label}
          </Badge>
        )}
        {actions}
        <Badge className="rounded-md text-[10px] text-accent max-[640px]:hidden" variant="secondary">
          {localContractLabel}
        </Badge>
      </div>
    </div>
  );
}
