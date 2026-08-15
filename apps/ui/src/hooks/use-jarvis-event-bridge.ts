import { useEffect } from "react";
import type { EventEnvelope } from "@jarvis-k/contracts";

export interface UseJarvisEventBridgeOptions {
  onEvent(envelope: EventEnvelope): void;
  refreshSnapshot(): void | Promise<void>;
}

export function useJarvisEventBridge({
  onEvent,
  refreshSnapshot,
}: UseJarvisEventBridgeOptions): void {
  useEffect(() => {
    const unsubscribe = window.jarvis?.onEvent(onEvent);
    void refreshSnapshot();
    return () => {
      unsubscribe?.();
    };
  }, [onEvent, refreshSnapshot]);
}
