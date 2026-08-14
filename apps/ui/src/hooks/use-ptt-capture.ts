import { useCallback, useEffect, useRef, useState } from "react"
import { createId, type AppCommand } from "@jarvis-k/contracts"
import {
  BrowserCaptureController,
  WebAudioCaptureBackend,
} from "@jarvis-k/voice-capture-browser"

import {
  PttCaptureCoordinator,
  type PttCommandError,
  type PttCommandResult,
  type PttStartFailureReason,
  type PttCaptureState,
  type PttStopReason,
} from "@/voice/ptt-capture-coordinator"

type SendCommand = (command: AppCommand) => Promise<PttCommandResult>
export type PttCaptureNotice =
  | "capture-unavailable"
  | "core-offline"
  | "permission-denied"
  | PttStartFailureReason

export function usePttCapture(sendCommand: SendCommand, enabled: boolean) {
  const coordinatorRef = useRef<PttCaptureCoordinator | null>(null)
  const enabledRef = useRef(enabled)
  const sendCommandRef = useRef(sendCommand)
  const [state, setState] = useState<PttCaptureState>("idle")
  const [audioDiagnostics, setAudioDiagnostics] = useState({
    framesSent: 0,
    peak: 0,
    rms: 0,
  })
  const [captureNotice, setCaptureNotice] = useState<PttCaptureNotice | null>(null)
  const [commandError, setCommandError] = useState<PttCommandError | null>(null)

  enabledRef.current = enabled
  sendCommandRef.current = sendCommand

  useEffect(() => {
    const backend = new WebAudioCaptureBackend({
      workletModuleUrl: new URL(
        "./voice-capture-worklet.js",
        window.location.href
      ).href,
      allowScriptProcessorFallback: true,
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
        await sendCommandRef.current({
          type: "voice.reportPermission",
          payload: { permission: "prompt" },
        })
        try {
          const started = await capture.start(options)
          if (started) {
            await sendCommandRef.current({
              type: "voice.reportPermission",
              payload: { permission: "granted" },
            })
            setCaptureNotice(null)
            setCommandError(null)
          }
          return started
        } catch (error) {
          setCommandError(createCaptureCommandError(error))
          if (isPermissionDenied(error)) {
            await sendCommandRef.current({
              type: "voice.reportPermission",
              payload: { permission: "denied" },
            })
            setCaptureNotice("permission-denied")
          } else {
            setCaptureNotice("capture-unavailable")
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
          setCaptureNotice(null)
          setCommandError(null)
          setAudioDiagnostics({
            framesSent: 0,
            peak: 0,
            rms: 0,
          })
        }
      },
      onStartFailure: (reason, error) => {
        setCaptureNotice(reason)
        setCommandError(error ?? null)
      },
      onCommandFailure: (error) => {
        setCommandError(error ?? null)
      },
      sendCommand: (command) => sendCommandRef.current(command),
    })
    coordinatorRef.current = coordinator
    setState("idle")

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
  }, [])

  const start = useCallback(async () => {
    if (!enabledRef.current) {
      setCaptureNotice("core-offline")
      return false
    }
    const started = (await coordinatorRef.current?.start()) ?? false
    if (!started) {
      setCaptureNotice((current) => current ?? "voice-session-unavailable")
    }
    return started
  }, [])

  const stop = useCallback(async (reason: PttStopReason) => {
    return coordinatorRef.current?.stop(reason) ?? false
  }, [])

  return {
    active: state === "starting" || state === "recording",
    audioDiagnostics,
    captureNotice,
    commandError,
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

function createCaptureCommandError(error: unknown): PttCommandError {
  const name =
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof (error as { name?: unknown }).name === "string"
      ? (error as { name: string }).name
      : "Error"
  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : "Browser microphone capture failed before audio frames were available."
  return {
    code: "BROWSER_CAPTURE_START_FAILED",
    message: `${name}: ${message}`,
    retryable: true,
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}
