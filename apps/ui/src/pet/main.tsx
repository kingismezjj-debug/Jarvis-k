import { StrictMode, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import type { DesktopPetSettings, DesktopPetState } from "@jarvis-k/contracts"
import "./pet.css"

const fallbackState: DesktopPetState = {
  state: "offline",
  updatedAt: new Date(0).toISOString(),
  reasonCategory: "core",
  sensitiveContentExposed: false,
}

const fallbackSettings: DesktopPetSettings = {
  enabled: false,
  alwaysOnTop: true,
  reducedMotion: "system",
  persistedLocally: true,
  syncedToCloud: false,
}

function Pet() {
  const [state, setState] = useState<DesktopPetState>(fallbackState)
  const [settings, setSettings] =
    useState<DesktopPetSettings>(fallbackSettings)

  useEffect(() => {
    let disposed = false
    void window.jarvisPet?.getPetState().then((nextState) => {
      if (!disposed) setState(nextState)
    })
    void window.jarvisPet?.getPetSettings().then((nextSettings) => {
      if (!disposed) setSettings(nextSettings)
    })
    const unsubscribe = window.jarvisPet?.onPetState((nextState) => {
      setState(nextState)
    })
    return () => {
      disposed = true
      unsubscribe?.()
    }
  }, [])

  const label = useMemo(() => {
    switch (state.state) {
      case "listening":
        return "Listening"
      case "thinking":
        return "Thinking"
      case "success":
        return "Ready"
      case "error":
        return "Needs attention"
      case "offline":
        return "Offline"
      default:
        return "Idle"
    }
  }, [state.state])

  const reducedMotion =
    settings.reducedMotion === "on" ||
    (settings.reducedMotion === "system" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)

  return (
    <main
      aria-label={`Jarvis-K Desktop Pet: ${label}`}
      className="pet-shell"
      data-motion={reducedMotion ? "reduced" : "normal"}
      data-state={state.state}
      onClick={() => {
        void window.jarvisPet?.openMainWindow()
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        void window.jarvisPet?.requestContextMenu()
      }}
    >
      <div aria-hidden="true" className="pet-drag-handle" />
      <button
        aria-label="Hide Desktop Pet"
        className="pet-hide"
        onClick={(event) => {
          event.stopPropagation()
          void window.jarvisPet?.hidePet()
        }}
        type="button"
      >
        x
      </button>
      <div className="pet-orb" aria-hidden="true">
        <div className="pet-core">JK</div>
        <div className="pet-ring" />
      </div>
      <span className="pet-label">{label}</span>
    </main>
  )
}

document.documentElement.classList.add("dark")

createRoot(document.getElementById("pet-root")!).render(
  <StrictMode>
    <Pet />
  </StrictMode>,
)
