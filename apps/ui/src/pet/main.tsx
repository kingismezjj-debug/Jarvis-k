import { StrictMode, useEffect, useMemo, useRef, useState } from "react"
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

type DragSession = {
  frame: number | null
  pendingPosition: { x: number; y: number } | null
  pointerId: number
  startScreenX: number
  startScreenY: number
  startWindowX: number
  startWindowY: number
  startedDragging: boolean
}

function Pet() {
  const [state, setState] = useState<DesktopPetState>(fallbackState)
  const [settings, setSettings] =
    useState<DesktopPetSettings>(fallbackSettings)
  const dragSessionRef = useRef<DragSession | null>(null)
  const suppressClickRef = useRef(false)

  const flushPendingPosition = () => {
    const session = dragSessionRef.current
    if (!session?.pendingPosition) return
    const nextPosition = session.pendingPosition
    session.pendingPosition = null
    void window.jarvisPet?.savePosition(nextPosition)
  }

  const schedulePositionSave = (position: { x: number; y: number }) => {
    const session = dragSessionRef.current
    if (!session) return
    session.pendingPosition = position
    if (session.frame !== null) return
    session.frame = window.requestAnimationFrame(() => {
      const currentSession = dragSessionRef.current
      if (currentSession) {
        currentSession.frame = null
      }
      flushPendingPosition()
    })
  }

  const endDragSession = (pointerId: number, target: HTMLElement) => {
    const session = dragSessionRef.current
    if (!session || session.pointerId !== pointerId) return
    if (session.frame !== null) {
      window.cancelAnimationFrame(session.frame)
      session.frame = null
    }
    flushPendingPosition()
    suppressClickRef.current = session.startedDragging
    dragSessionRef.current = null
    target.releasePointerCapture(pointerId)
  }

  useEffect(() => {
    let disposed = false
    const refreshSettings = () => {
      void window.jarvisPet?.getPetSettings().then((nextSettings) => {
        if (!disposed) setSettings(nextSettings)
      })
    }
    void window.jarvisPet?.getPetState().then((nextState) => {
      if (!disposed) setState(nextState)
    })
    refreshSettings()
    const unsubscribe = window.jarvisPet?.onPetState((nextState) => {
      setState(nextState)
      refreshSettings()
    })
    return () => {
      disposed = true
      unsubscribe?.()
      const session = dragSessionRef.current
      if (session?.frame !== null) {
        window.cancelAnimationFrame(session.frame)
      }
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
      onClick={(event) => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false
          event.preventDefault()
          event.stopPropagation()
          return
        }
        void window.jarvisPet?.openMainWindow()
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        void window.jarvisPet?.requestContextMenu()
      }}
      onPointerCancel={(event) => {
        endDragSession(event.pointerId, event.currentTarget)
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        dragSessionRef.current = {
          frame: null,
          pendingPosition: null,
          pointerId: event.pointerId,
          startScreenX: event.screenX,
          startScreenY: event.screenY,
          startWindowX: Math.round(window.screenX),
          startWindowY: Math.round(window.screenY),
          startedDragging: false,
        }
      }}
      onPointerMove={(event) => {
        const session = dragSessionRef.current
        if (!session || session.pointerId !== event.pointerId) return
        const deltaX = event.screenX - session.startScreenX
        const deltaY = event.screenY - session.startScreenY
        if (!session.startedDragging) {
          if (Math.abs(deltaX) + Math.abs(deltaY) < 4) return
          session.startedDragging = true
        }
        schedulePositionSave({
          x: Math.round(session.startWindowX + deltaX),
          y: Math.round(session.startWindowY + deltaY),
        })
      }}
      onPointerUp={(event) => {
        endDragSession(event.pointerId, event.currentTarget)
      }}
    >
      <div className="pet-robot" aria-hidden="true">
        <div className="pet-halo" />
        <div className="pet-ear pet-ear-left" />
        <div className="pet-ear pet-ear-right" />
        <div className="pet-arm pet-arm-left" />
        <div className="pet-arm pet-arm-right" />
        <div className="pet-orb">
          <div className="pet-antenna" />
          <div className="pet-face">
            <span className="pet-eye pet-eye-left" />
            <span className="pet-eye pet-eye-right" />
            <span className="pet-mouth" />
            <span className="pet-status-glyph" />
          </div>
        </div>
        <div className="pet-ring" />
        <div className="pet-shadow" />
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
