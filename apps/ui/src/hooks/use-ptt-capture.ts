import { useCallback, useEffect, useRef, useState } from "react"
import { createId, type AppCommand } from "@jarvis-k/contracts"
import {
  BrowserCaptureController,
  WebAudioCaptureBackend,
} from "@jarvis-k/voice-capture-browser"

import {
  PttCaptureCoordinator,
  type PttCaptureState,
  type PttStopReason,
} from "@/voice/ptt-capture-coordinator"

type SendCommand = (command: AppCommand) => Promise<boolean>

export function usePttCapture(sendCommand: SendCommand, enabled: boolean) {
  const coordinatorRef = useRef<PttCaptureCoordinator | null>(null)
  const enabledRef = useRef(enabled)
  const [state, setState] = useState<PttCaptureState>("idle")
  const [audioDiagnostics, setAudioDiagnostics] = useState({
    framesSent: 0,
    peak: 0,
    rms: 0,
  })

  enabledRef.current = enabled

  useEffect(() => {
    const backend = new WebAudioCaptureBackend({
      workletModuleUrl: new URL(
        "./voice-capture-worklet.js",
        window.location.href
      ).href,
    })
    const capture = new BrowserCaptureController({
      backend,
      clock: { now: () => new Date() },
      frameSink: (frame) => {
        setAudioDiagnostics((current) => ({
          framesSent: current.framesSent + 1,
          peak: frame.diagnostics.peak,
          rms: frame.diagnostics.rms,
        }))
        const pcm = new Uint8Array(
          frame.pcm.buffer,
          frame.pcm.byteOffset,
          frame.pcm.byteLength
        ).slice()
        window.jarvis?.sendVoiceAudio({
          metadata: frame.metadata,
          pcm,
        })
      },
    })
    const permissionAwareCapture = {
      start: async (options: { captureId: string }) => {
        await sendCommand({
          type: "voice.reportPermission",
          payload: { permission: "prompt" },
        })
        try {
          const started = await capture.start(options)
          if (started) {
            await sendCommand({
              type: "voice.reportPermission",
              payload: { permission: "granted" },
            })
          }
          return started
        } catch (error) {
          if (isPermissionDenied(error)) {
            await sendCommand({
              type: "voice.reportPermission",
              payload: { permission: "denied" },
            })
          }
          throw error
        }
      },
      stop: () => capture.stop(),
      dispose: () => capture.dispose(),
    }
    const coordinator = new PttCaptureCoordinator({
      capture: permissionAwareCapture,
      createCaptureId: () => createId("capture"),
      onStateChange: (nextState) => {
        setState(nextState)
        if (nextState === "starting") {
          setAudioDiagnostics({
            framesSent: 0,
            peak: 0,
            rms: 0,
          })
        }
      },
      sendCommand,
    })
    coordinatorRef.current = coordinator

    const handleBlur = () => {
      void coordinator.stop("window-blur")
    }
    const handlePageHide = () => {
      void coordinator.dispose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        isEditableTarget(event.target) ||
        !enabledRef.current
      ) {
        if (event.code === "Escape") {
          void coordinator.stop("user-cancel")
        }
        return
      }
      event.preventDefault()
      void coordinator.start()
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isEditableTarget(event.target)) {
        return
      }
      event.preventDefault()
      void coordinator.stop("release")
    }

    window.addEventListener("blur", handleBlur)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("pagehide", handlePageHide)
    return () => {
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("pagehide", handlePageHide)
      coordinatorRef.current = null
      void coordinator.dispose()
    }
  }, [sendCommand])

  const start = useCallback(async () => {
    if (!enabledRef.current) return false
    return coordinatorRef.current?.start() ?? false
  }, [])

  const stop = useCallback(async (reason: PttStopReason) => {
    return coordinatorRef.current?.stop(reason) ?? false
  }, [])

  return {
    active: state === "starting" || state === "recording",
    audioDiagnostics,
    start,
    state,
    stop,
  }
}

function isPermissionDenied(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "NotAllowedError"
  )
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}
