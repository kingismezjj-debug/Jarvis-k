import { useCallback, useEffect, useMemo, useState } from "react";
import type { UiSurfaceCapabilityStatus } from "@jarvis-k/contracts";

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

  useEffect(() => {
    let disposed = false;
    const bridge = window.jarvis;
    if (!bridge?.getUiSurfaceCapabilityStatus) {
      setCapabilityStatus(null);
      return;
    }
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
      resetUiSurfaceMode,
      setDeveloperModeEnabled,
    }),
    [
      capabilityStatus,
      developerModeEnabled,
      resetUiSurfaceMode,
      setDeveloperModeEnabled,
    ],
  );
}
