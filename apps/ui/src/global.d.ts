import type { JarvisBridge } from "@jarvis-k/contracts"

declare global {
  interface Window {
    jarvis?: JarvisBridge
  }
}

export {}
