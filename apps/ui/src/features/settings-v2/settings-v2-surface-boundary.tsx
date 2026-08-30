import { Component, type ReactNode, useEffect, useRef } from "react";

type SettingsV2SurfaceHealthReporter = (
  state: "mounting" | "ready" | "failed" | "unmounted",
  reasonCode:
    | "settings_v2_mounting"
    | "settings_v2_ready"
    | "settings_v2_renderer_failure"
    | "settings_v2_unmounted",
) => void;

type SettingsV2SurfaceHostProps = {
  children: ReactNode;
  reportHealth: SettingsV2SurfaceHealthReporter;
};

export function SettingsV2SurfaceHost({
  children,
  reportHealth,
}: SettingsV2SurfaceHostProps) {
  const failedRef = useRef(false);

  useEffect(() => {
    failedRef.current = false;
    reportHealth("mounting", "settings_v2_mounting");
    const readyFrame = window.requestAnimationFrame(() => {
      if (!failedRef.current) {
        reportHealth("ready", "settings_v2_ready");
      }
    });
    return () => {
      window.cancelAnimationFrame(readyFrame);
      if (!failedRef.current) {
        reportHealth("unmounted", "settings_v2_unmounted");
      }
    };
  }, [reportHealth]);

  return (
    <SettingsV2SurfaceErrorBoundary
      onFailure={() => {
        failedRef.current = true;
        reportHealth("failed", "settings_v2_renderer_failure");
      }}
    >
      {children}
    </SettingsV2SurfaceErrorBoundary>
  );
}

type SettingsV2SurfaceErrorBoundaryProps = {
  children: ReactNode;
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
          Settings is recovering.
        </div>
      );
    }
    return this.props.children;
  }
}
