import { useCallback, useEffect, useState } from "react"
import {
  CoreSnapshotSchema,
  type AppCommand,
  type CoreSnapshot,
  type EventEnvelope,
} from "@jarvis-k/contracts"

type CoreConnection = "connecting" | "online" | "restarting" | "offline"

const MAX_EVENTS = 40

export function useJarvis() {
  const [snapshot, setSnapshot] = useState<CoreSnapshot | null>(null)
  const [events, setEvents] = useState<EventEnvelope[]>([])
  const [connection, setConnection] = useState<CoreConnection>("connecting")
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const applyEvent = useCallback((envelope: EventEnvelope) => {
    setEvents((current) => [envelope, ...current].slice(0, MAX_EVENTS))

    if (envelope.event.type === "state.snapshot") {
      setSnapshot(envelope.event.payload)
      setConnection("online")
      setError(null)
    }

    if (envelope.event.type === "system.core.lifecycle") {
      const status = envelope.event.payload.status
      if (status === "online") setConnection("online")
      if (status === "starting" || status === "restarting") {
        setConnection("restarting")
      }
      if (status === "stopped" || status === "failed") {
        setConnection("offline")
      }
    }
  }, [])

  const refreshSnapshot = useCallback(async () => {
    if (!window.jarvis) {
      setConnection("offline")
      setError("Desktop bridge unavailable.")
      return
    }

    const result = await window.jarvis.getSnapshot()
    if (!result.ok) {
      setError(result.error.message)
      setConnection("offline")
      return
    }

    const parsed = CoreSnapshotSchema.safeParse(result.data)
    if (!parsed.success) {
      setError("Core returned an invalid state snapshot.")
      return
    }

    setSnapshot(parsed.data)
    setConnection("online")
    setError(null)
  }, [])

  const sendCommand = useCallback(async (command: AppCommand) => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.")
      return false
    }

    setSending(true)
    try {
      const result = await window.jarvis.sendCommand(command)
      if (!result.ok) {
        setError(result.error.message)
        return false
      }
      setError(null)
      return true
    } finally {
      setSending(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) =>
      sendCommand({
        type: "agent.sendMessage",
        payload: {
          conversationId: "primary",
          text,
        },
      }),
    [sendCommand]
  )

  const probeCore = useCallback(
    async () =>
      sendCommand({
        type: "agent.ping",
        payload: { sentAt: new Date().toISOString() },
      }),
    [sendCommand]
  )

  const openVoiceSettings = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.")
      return
    }
    try {
      await window.jarvis.openVoiceSettings()
      setError(null)
    } catch {
      setError("Voice settings could not be opened.")
    }
  }, [])

  useEffect(() => {
    const unsubscribe = window.jarvis?.onEvent(applyEvent)
    void refreshSnapshot()
    return () => unsubscribe?.()
  }, [applyEvent, refreshSnapshot])

  return {
    connection,
    error,
    events,
    openVoiceSettings,
    probeCore,
    refreshSnapshot,
    sendCommand,
    sendMessage,
    sending,
    snapshot,
  }
}
