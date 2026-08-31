import { Component, type ReactNode, useEffect, useRef } from "react";
import type { UiSurfaceCapabilityStatus } from "@jarvis-k/contracts";
import type { UiLanguage } from "@/app/types";

type SettingsV2SurfaceHealthEvent = {
  state: "mounting" | "ready" | "failed" | "unmounted";
  reasonCode:
    | "settings_v2_mounting"
    | "settings_v2_ready"
    | "settings_v2_renderer_failure"
    | "settings_v2_unmounted";
  generation?: number | null;
};

type SettingsV2SurfaceHealthReporter = (
  event: SettingsV2SurfaceHealthEvent,
) => Promise<UiSurfaceCapabilityStatus | null>;

type SettingsV2SurfaceHostProps = {
  children: ReactNode;
  locale: UiLanguage;
  reportHealth: SettingsV2SurfaceHealthReporter;
};

export function SettingsV2SurfaceHost({
  children,
  locale,
  reportHealth,
}: SettingsV2SurfaceHostProps) {
  const failedRef = useRef(false);
  const generationRef = useRef<number | null>(null);
  const effectTokenRef = useRef(0);

  useEffect(() => {
    let disposed = false;
    let readyFrame: number | null = null;
    const effectToken = effectTokenRef.current + 1;
    effectTokenRef.current = effectToken;

    void (async () => {
      const status = await reportHealth({
        state: "mounting",
        reasonCode: "settings_v2_mounting",
        generation: null,
      });
      const generation = status?.settingsV2MountGeneration ?? null;
      generationRef.current = generation;
      if (generation === null) {
        return;
      }
      if (disposed) {
        if (effectTokenRef.current !== effectToken) {
          return;
        }
        await reportHealth({
          state: "unmounted",
          reasonCode: "settings_v2_unmounted",
          generation,
        });
        return;
      }
      if (failedRef.current) {
        await reportHealth({
          state: "failed",
          reasonCode: "settings_v2_renderer_failure",
          generation,
        });
        return;
      }
      readyFrame = window.requestAnimationFrame(() => {
        if (!disposed && !failedRef.current) {
          void reportHealth({
            state: "ready",
            reasonCode: "settings_v2_ready",
            generation,
          });
        }
      });
    })();

    return () => {
      disposed = true;
      if (readyFrame !== null) {
        window.cancelAnimationFrame(readyFrame);
      }
      const generation = generationRef.current;
      generationRef.current = null;
      if (generation !== null && !failedRef.current) {
        void reportHealth({
          state: "unmounted",
          reasonCode: "settings_v2_unmounted",
          generation,
        });
      }
    };
  }, [reportHealth]);

  return (
    <SettingsV2SurfaceErrorBoundary
      onFailure={() => {
        failedRef.current = true;
        const generation = generationRef.current;
        if (generation !== null) {
          void reportHealth({
            state: "failed",
            reasonCode: "settings_v2_renderer_failure",
            generation,
          });
        }
      }}
      locale={locale}
    >
      {children}
    </SettingsV2SurfaceErrorBoundary>
  );
}

type SettingsV2SurfaceErrorBoundaryProps = {
  children: ReactNode;
  locale: UiLanguage;
  onFailure: () => void;
};

type SettingsV2SurfaceErrorBoundaryState = {
  failed: boolean;
};

class SettingsV2SurfaceErrorBoundary extends Component<
  SettingsV2SurfaceErrorBoundaryProps,
  SettingsV2SurfaceErrorBoundaryState
> {
  public state: SettingsV2SurfaceErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): SettingsV2SurfaceErrorBoundaryState {
    return { failed: true };
  }

  public componentDidCatch(): void {
    this.props.onFailure();
  }

  public render(): ReactNode {
    if (this.state.failed) {
      return (
        <div
          className="p-6 text-sm text-muted-foreground"
          data-testid="settings-v2-session-fallback-pending"
        >
          {this.props.locale === "zh"
            ? "新版设置无法显示，正在打开旧版设置……"
            : "New settings could not be displayed. Opening classic settings..."}
        </div>
      );
    }
    return this.props.children;
  }
}
