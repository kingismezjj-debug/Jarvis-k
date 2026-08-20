import { Mic2, MicOff, PanelLeft, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NavigationButton } from "@/components/assistant-shell/NavigationButton";
import { cn } from "@/lib/utils";
import type { ConversationCopy } from "@/features/conversation/types";
import type { ActiveView, NavItem } from "./types";

export type AppNavigationProps = {
  activeView: ActiveView;
  copy: ConversationCopy;
  coreOnline: boolean;
  inspectorOpen: boolean;
  items: NavItem[];
  showInspectorToggle: boolean;
  ptt: {
    active: boolean;
    state: string;
  };
  textOnlyAcceptanceMode: boolean;
  onSelectView: (view: ActiveView) => void;
  onStartPtt: () => void;
  onStopPtt: (reason: "release" | "user-cancel") => void;
  onToggleInspector: () => void;
};

export function AppNavigation({
  activeView,
  copy,
  coreOnline,
  inspectorOpen,
  items,
  onSelectView,
  onStartPtt,
  onStopPtt,
  onToggleInspector,
  ptt,
  showInspectorToggle,
  textOnlyAcceptanceMode,
}: AppNavigationProps) {
  return (
    <aside className="flex min-h-0 flex-col items-center justify-between border-r bg-card py-[18px]">
      <nav className="flex flex-col gap-2" aria-label="Primary navigation">
        {items.map((item) => (
          <NavigationButton
            active={activeView === item.id}
            item={item}
            key={item.id}
            label={
              item.id === "developer"
                ? ((copy.nav as Record<string, string>).developer ??
                  "Developer")
                : copy.nav[item.id]
            }
            onSelect={onSelectView}
          />
        ))}
      </nav>
      <div className="flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={
                textOnlyAcceptanceMode
                  ? copy.label.textOnlyAcceptance
                  : copy.label.pushToTalk
              }
              aria-pressed={ptt.active}
              className={cn(
                "size-10 rounded-md",
                ptt.active && "bg-destructive text-destructive-foreground",
              )}
              data-capture-state={ptt.state}
              data-testid={
                textOnlyAcceptanceMode
                  ? "text-only-voice-disabled"
                  : "push-to-talk"
              }
              disabled={!coreOnline || textOnlyAcceptanceMode}
              onContextMenu={(event) => event.preventDefault()}
              onPointerCancel={() => {
                if (textOnlyAcceptanceMode) return;
                onStopPtt("user-cancel");
              }}
              onPointerDown={(event) => {
                if (textOnlyAcceptanceMode) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                onStartPtt();
              }}
              onPointerUp={(event) => {
                if (textOnlyAcceptanceMode) return;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                onStopPtt("release");
              }}
              size="icon-lg"
              type="button"
              variant={ptt.active ? "default" : "outline"}
            >
              {textOnlyAcceptanceMode ? (
                <MicOff className="size-4" />
              ) : (
                <Mic2 className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {textOnlyAcceptanceMode
              ? copy.label.textOnlyAcceptance
              : copy.label.pushToTalk}
          </TooltipContent>
        </Tooltip>
        {showInspectorToggle ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={copy.label.toggleInspector}
                aria-pressed={inspectorOpen}
                data-testid="toggle-inspector"
                onClick={onToggleInspector}
                size="icon-lg"
                type="button"
                variant="ghost"
              >
                <PanelLeft className="size-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {inspectorOpen
                ? copy.label.hideInspector
                : copy.label.showInspector}
            </TooltipContent>
          </Tooltip>
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={copy.label.generalSettings}
              aria-pressed={activeView === "settings"}
              className={cn(
                "size-10 rounded-md text-muted-foreground",
                activeView === "settings" &&
                  "bg-secondary text-primary hover:bg-secondary",
              )}
              data-testid="general-settings"
              onClick={() => onSelectView("settings")}
              size="icon-lg"
              type="button"
              variant="ghost"
            >
              <Settings className="size-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {copy.label.generalSettings}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
