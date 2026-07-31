import { useMemo, useState, type FormEvent } from "react"
import {
  Activity,
  Bot,
  CheckCircle2,
  CircleAlert,
  ListTodo,
  MessageSquare,
  Mic2,
  PanelLeft,
  RefreshCw,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react"
import type { EventEnvelope } from "@jarvis-k/contracts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useJarvis } from "@/hooks/use-jarvis"
import { usePttCapture } from "@/hooks/use-ptt-capture"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  icon: LucideIcon
  active?: boolean
}

const primaryNavigation: NavItem[] = [
  { label: "Conversation", icon: MessageSquare, active: true },
  { label: "Tasks", icon: ListTodo },
  { label: "Voice", icon: Mic2 },
  { label: "Activity", icon: Activity },
]

function eventLabel(envelope: EventEnvelope) {
  const event = envelope.event
  switch (event.type) {
    case "system.core.ready":
      return `Core instance ${event.payload.coreInstanceId.slice(-8)}`
    case "system.health":
      return `Health ${event.payload.status} / ${Math.round(event.payload.uptimeMs)} ms`
    case "system.core.lifecycle":
      return `Supervisor ${event.payload.status}`
    case "state.snapshot":
      return `Snapshot synchronized / ${event.payload.sequenceId}`
    case "agent.message.accepted":
      return `Message accepted / ${event.payload.id.slice(-8)}`
    case "voice.state.changed":
      return `Voice ${event.payload.mode} / ${event.payload.state}`
    case "voice.transcript.updated":
      return `${event.payload.isFinal ? "Final" : "Partial"} transcript / ${
        event.payload.text || "empty"
      }`
    case "voice.permission.changed":
      return `Microphone permission ${event.payload.permission}`
    case "voice.playback.interrupted":
      return `Playback interrupted / ${event.payload.reason}`
    case "voice.diagnostic":
      return `Voice diagnostic / ${event.payload.code}`
    case "voice.error":
      return `Voice error / ${event.payload.error.message}`
  }
}

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))
}

function NavigationButton({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={item.label}
          className={cn(
            "relative size-10 rounded-md text-muted-foreground",
            item.active && "bg-secondary text-primary hover:bg-secondary"
          )}
          size="icon-lg"
          variant="ghost"
        >
          {item.active && (
            <span className="absolute -left-[17px] h-5 w-0.5 rounded-r bg-primary" />
          )}
          <Icon className="size-[18px]" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export default function App() {
  const {
    connection,
    error,
    events,
    openVoiceSettings,
    probeCore,
    sendCommand,
    sendMessage,
    sending,
    snapshot,
  } = useJarvis()
  const [draft, setDraft] = useState("")

  const coreOnline = connection === "online"
  const ptt = usePttCapture(sendCommand, coreOnline)
  const recentEvents = useMemo(() => events.slice(0, 12), [events])
  const voiceTranscript = snapshot?.voice.transcript?.text ?? ""
  const voiceRms = `${Math.round(ptt.audioDiagnostics.rms * 100)}%`
  const voicePeak = `${Math.round(ptt.audioDiagnostics.peak * 100)}%`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    const accepted = await sendMessage(text)
    if (accepted) setDraft("")
  }

  return (
    <div
      className="flex h-screen min-h-[620px] min-w-[920px] flex-col overflow-hidden bg-background text-foreground"
      data-testid="jarvis-app"
      data-voice-permission={snapshot?.voice.permission ?? "unknown"}
      data-voice-state={snapshot?.voice.state ?? "idle"}
      data-voice-transcript={snapshot?.voice.transcript?.text ?? ""}
      data-voice-transcript-final={
        snapshot?.voice.transcript?.isFinal ? "true" : "false"
      }
    >
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b bg-card px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            JK
          </div>
          <div className="min-w-0">
            <h1 className="text-[21px] font-bold leading-6">JARVIS-K</h1>
            <p className="text-[11px] leading-4 text-muted-foreground">
              PHASE 1 / SUPERVISED RUNTIME
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="h-7 rounded-md px-2.5 text-[11px]" variant="secondary">
            PROTOCOL V1
          </Badge>
          <Badge
            className="h-7 rounded-md border-border px-2.5 text-[11px]"
            data-testid="core-status"
            variant="outline"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                coreOnline ? "bg-success" : "bg-warning"
              )}
            />
            {connection.toUpperCase()}
          </Badge>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[76px_minmax(0,1fr)_320px] max-[1080px]:grid-cols-[68px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col items-center justify-between border-r bg-card py-[18px]">
          <nav className="flex flex-col gap-2" aria-label="Primary navigation">
            {primaryNavigation.map((item) => (
              <NavigationButton item={item} key={item.label} />
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Push to talk"
                  aria-pressed={ptt.active}
                  className={cn(
                    "size-10 rounded-md",
                    ptt.active && "bg-destructive text-destructive-foreground"
                  )}
                  data-capture-state={ptt.state}
                  data-testid="push-to-talk"
                  disabled={!coreOnline}
                  onContextMenu={(event) => event.preventDefault()}
                  onPointerCancel={() => void ptt.stop("user-cancel")}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId)
                    void ptt.start()
                  }}
                  onPointerUp={(event) => {
                    if (
                      event.currentTarget.hasPointerCapture(event.pointerId)
                    ) {
                      event.currentTarget.releasePointerCapture(event.pointerId)
                    }
                    void ptt.stop("release")
                  }}
                  size="icon-lg"
                  type="button"
                  variant={ptt.active ? "default" : "outline"}
                >
                  <Mic2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Push to talk</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Toggle navigation" size="icon-lg" variant="ghost">
                  <PanelLeft className="size-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle navigation</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Voice service settings"
                  onClick={() => void openVoiceSettings()}
                  size="icon-lg"
                  variant="ghost"
                >
                  <Settings className="size-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Voice service settings</TooltipContent>
            </Tooltip>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col bg-background">
          <div className="flex h-[70px] shrink-0 items-center justify-between border-b px-7">
            <div>
              <h2 className="text-sm font-semibold">Primary Session</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                snapshot restored / sequence {snapshot?.sequenceId ?? 0}
              </p>
            </div>
            <Badge className="rounded-md text-[10px] text-accent" variant="secondary">
              LOCAL CONTRACT
            </Badge>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="flex min-h-full flex-col gap-6 px-8 py-7" data-testid="message-list">
              <div className="flex gap-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className="max-w-[760px] space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">AGENT CORE</p>
                  <p className="text-sm leading-6">
                    Runtime ready. Typed contracts are active and the renderer snapshot is synchronized.
                  </p>
                </div>
              </div>

              {snapshot?.messages.map((message) => (
                <div className="flex justify-end" key={message.id}>
                  <div className="max-w-[72%] rounded-md bg-secondary px-3.5 py-2.5 text-sm leading-5">
                    {message.text}
                  </div>
                </div>
              ))}

              {events.some((item) => item.event.type === "agent.message.accepted") && (
                <div className="flex w-fit items-center gap-2 rounded-md border bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-accent" />
                  agent.message.accepted / correlated command
                </div>
              )}

              {(voiceTranscript || snapshot?.voice.state !== "idle") && (
                <div
                  className="max-w-[760px] rounded-md border bg-card px-4 py-3"
                  data-testid="voice-transcript-panel"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      VOICE TRANSCRIPT
                    </p>
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      {snapshot?.voice.transcript?.isFinal ? "FINAL" : snapshot?.voice.state.toUpperCase()}
                    </Badge>
                  </div>
                  <p
                    className="mt-2 min-h-5 text-sm leading-6"
                    data-testid="voice-transcript"
                  >
                    {voiceTranscript || "Listening..."}
                  </p>
                </div>
              )}

              {error && (
                <div className="flex w-fit items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <CircleAlert className="size-3.5" />
                  {error}
                </div>
              )}
            </div>
          </ScrollArea>

          <form
            className="flex h-[88px] shrink-0 items-center gap-2.5 border-t bg-card px-6"
            onSubmit={handleSubmit}
          >
            <Input
              aria-label="Command"
              className="h-10 rounded-md bg-input/45 px-3.5"
              data-testid="command-input"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Send a typed command to Agent Core"
              value={draft}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Send command"
                  className="size-10 rounded-md"
                  data-testid="send-command"
                  disabled={!draft.trim() || sending}
                  size="icon-lg"
                  type="submit"
                >
                  <Send className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send command</TooltipContent>
            </Tooltip>
          </form>
        </main>

        <aside className="min-h-0 border-l bg-card max-[1080px]:hidden">
          <div className="flex h-full min-h-0 flex-col px-[18px] py-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold">Runtime Activity</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  supervisor + core event stream
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Probe Core"
                    className="rounded-md"
                    onClick={() => void probeCore()}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <RefreshCw className={cn("size-3.5", sending && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Probe Core</TooltipContent>
              </Tooltip>
            </div>

            <Separator className="my-4" />

            <dl className="shrink-0 divide-y divide-border border-y text-[11px]">
              <Metric label="CORE HEALTH" value={snapshot?.health ?? connection} tone="success" />
              <Metric label="VOICE ENGINE" value={snapshot?.voice.state ?? "disabled"} tone="warning" />
              <Metric label="MIC PERMISSION" value={snapshot?.voice.permission ?? "unknown"} />
              <Metric label="VOICE FRAMES" value={String(ptt.audioDiagnostics.framesSent)} />
              <Metric label="VOICE RMS" value={voiceRms} />
              <Metric label="VOICE PEAK" value={voicePeak} />
              <Metric label="TRANSPORT" value="IPC" tone="accent" />
              <Metric label="SEQUENCE" value={String(snapshot?.sequenceId ?? 0).padStart(4, "0")} />
            </dl>

            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Events</h3>
              <span className="text-[10px] text-muted-foreground">{recentEvents.length} EVENTS</span>
            </div>

            <ScrollArea className="mt-4 min-h-0 flex-1">
              <div className="space-y-4 pr-3" data-testid="event-list">
                {recentEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Waiting for Core events.</p>
                ) : (
                  recentEvents.map((envelope) => (
                    <div className="flex gap-2.5" key={envelope.eventId}>
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[11px] font-medium">{envelope.event.type}</p>
                          <time className="shrink-0 text-[10px] text-muted-foreground">
                            {formatEventTime(envelope.createdAt)}
                          </time>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {eventLabel(envelope)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <Separator className="my-4" />
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {coreOnline ? (
                <CheckCircle2 className="size-3.5 text-success" />
              ) : (
                <CircleAlert className="size-3.5 text-warning" />
              )}
              <span data-testid="core-instance">
                {snapshot?.coreInstanceId
                  ? `instance ${snapshot.coreInstanceId.slice(-12)}`
                  : "awaiting core instance"}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Metric({
  label,
  tone,
  value,
}: {
  label: string
  tone?: "success" | "warning" | "accent"
  value: string
}) {
  return (
    <div className="flex h-[42px] items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-medium uppercase",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "accent" && "text-accent"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
