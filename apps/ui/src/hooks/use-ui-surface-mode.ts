import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  UiSurfaceSessionFallbackRequest,
  UiSurfaceCapabilityStatus,
  UiSurfaceHealthReport,
} from "@jarvis-k/contracts";

import {
  persistDeveloperMode,
  projectUiSurfaceMode,
  readStoredDeveloperMode,
} from "@/app/ui-surface-mode";

function getStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function useUiSurfaceMode() {
  const [developerModeEnabled, setDeveloperModeEnabledState] = useState(() =>
    readStoredDeveloperMode(getStorage()),
  );
  const [capabilityStatus, setCapabilityStatus] =
    useState<UiSurfaceCapabilityStatus | null>(null);

  const refreshUiSurfaceCapabilityStatus = useCallback(async () => {
    const bridge = window.jarvis;
    if (!bridge?.getUiSurfaceCapabilityStatus) {
      setCapabilityStatus(null);
      return;
    }
    try {
      const status = await bridge.getUiSurfaceCapabilityStatus();
      setCapabilityStatus(status);
    } catch {
      setCapabilityStatus(null);
    }
  }, []);

  const reportUiSurfaceHealth = useCallback(
    async (report: UiSurfaceHealthReport) => {
      const bridge = window.jarvis;
      if (!bridge?.reportUiSurfaceHealth) {
        setCapabilityStatus(null);
        return null;
      }
      try {
        const status = await bridge.reportUiSurfaceHealth(report);
        if (report.state !== "failed") {
          setCapabilityStatus(status);
        }
        return status;
      } catch {
        setCapabilityStatus(null);
        return null;
      }
    },
    [],
  );

  const requestUiSurfaceSessionFallback = useCallback(async () => {
    const bridge = window.jarvis;
    if (!bridge?.requestUiSurfaceSessionFallback) {
      setCapabilityStatus(null);
      return null;
    }
    const request: UiSurfaceSessionFallbackRequest = {
      surface: "settings_v2",
      action: "use_classic_settings",
      source: "renderer",
      sensitiveValuesExposed: false,
      rendererWritable: false,
    };
    try {
      const status = await bridge.requestUiSurfaceSessionFallback(request);
      setCapabilityStatus(status);
      return status;
    } catch {
      setCapabilityStatus(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    const bridge = window.jarvis;
    if (!bridge?.getUiSurfaceCapabilityStatus) {
      setCapabilityStatus(null);
      return;
    }
    const removeStatusListener = bridge.onUiSurfaceCapabilityStatus?.(
      (status) => {
        if (!disposed) {
          setCapabilityStatus(status);
        }
      },
    );
    void bridge
      .getUiSurfaceCapabilityStatus()
      .then((status) => {
        if (!disposed) {
          setCapabilityStatus(status);
        }
      })
      .catch(() => {
        if (!disposed) {
          setCapabilityStatus(null);
        }
      });
    return () => {
      disposed = true;
      removeStatusListener?.();
    };
  }, []);

  const setDeveloperModeEnabled = useCallback((enabled: boolean) => {
    persistDeveloperMode(getStorage(), enabled);
    setDeveloperModeEnabledState(enabled);
  }, []);

  const resetUiSurfaceMode = useCallback(() => {
    persistDeveloperMode(getStorage(), false);
    setDeveloperModeEnabledState(false);
  }, []);

  return useMemo(
    () => ({
      ...projectUiSurfaceMode({ developerModeEnabled, capabilityStatus }),
      capabilityStatus,
      refreshUiSurfaceCapabilityStatus,
      reportUiSurfaceHealth,
      requestUiSurfaceSessionFallback,
      resetUiSurfaceMode,
      setDeveloperModeEnabled,
    }),
    [
      capabilityStatus,
      developerModeEnabled,
      refreshUiSurfaceCapabilityStatus,
      reportUiSurfaceHealth,
      requestUiSurfaceSessionFallback,
      resetUiSurfaceMode,
      setDeveloperModeEnabled,
    ],
  );
}
