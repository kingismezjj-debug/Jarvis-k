import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { SkinThemeId, UiLanguage } from "./types";

export type AppShellProps = {
  allowNarrowLayout?: boolean;
  children: ReactNode;
  header: ReactNode;
  inspector?: ReactNode;
  inspectorOpen: boolean;
  navigation: ReactNode;
  skinTheme: SkinThemeId;
  textOnlyBanner?: ReactNode;
  uiLanguage: UiLanguage;
  voicePermission: string;
  voiceState: string;
  voiceTranscript: string;
  voiceTranscriptFinal: boolean;
};

export function AppShell({
  allowNarrowLayout = false,
  children,
  header,
  inspector,
  inspectorOpen,
  navigation,
  skinTheme,
  textOnlyBanner,
  uiLanguage,
  voicePermission,
  voiceState,
  voiceTranscript,
  voiceTranscriptFinal,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex h-screen min-h-[620px] flex-col overflow-hidden bg-background text-foreground",
        !allowNarrowLayout && "min-w-[920px]",
      )}
      data-testid="jarvis-app"
      data-skin-theme={skinTheme}
      data-ui-language={uiLanguage}
      data-voice-permission={voicePermission}
      data-voice-state={voiceState}
      data-voice-transcript={voiceTranscript}
      data-voice-transcript-final={voiceTranscriptFinal ? "true" : "false"}
    >
      {header}
      {textOnlyBanner}
      <div
        className={cn(
          "grid min-h-0 flex-1",
          inspectorOpen
            ? "grid-cols-[76px_minmax(0,1fr)_320px] max-[1080px]:grid-cols-[68px_minmax(0,1fr)]"
            : "grid-cols-[76px_minmax(0,1fr)] max-[1080px]:grid-cols-[68px_minmax(0,1fr)]",
        )}
      >
        {navigation}
        <main className="flex min-h-0 min-w-0 flex-col bg-background">
          {children}
        </main>
        {inspectorOpen ? inspector : null}
      </div>
    </div>
  );
}
