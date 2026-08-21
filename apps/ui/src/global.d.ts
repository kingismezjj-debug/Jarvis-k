import type { JarvisBridge, JarvisPetBridge } from "@jarvis-k/contracts"

declare global {
  interface Window {
    jarvis?: JarvisBridge
    jarvisPet?: JarvisPetBridge
  }
}

export {}
