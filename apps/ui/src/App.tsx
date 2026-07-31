import { useMemo, useState, type FormEvent } from "react"
import {
  Activity,
  Bot,
  Check,
  CheckCircle2,
  CircleAlert,
  Download,
  ListTodo,
  MessageSquare,
  Mic2,
  PanelLeft,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react"
import type { EventEnvelope } from "@jarvis-k/contracts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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

const activeModelOperationPhases = new Set([
  "queued",
  "prechecking",
  "downloading",
  "verifying",
  "loading",
  "releasing",
  "removing",
])

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
    case "model.operation.updated":
      return `Model ${event.payload.phase} / ${event.payload.modelId}`
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
    createConversation,
    error,
    events,
    exportMemorySnapshot,
    importMemorySnapshot,
    inferenceProviderRequirements,
    inferenceProviders,
    modelCandidates,
    modelInstallabilityReports,
    modelInventory,
    modelManifests,
    modelOperations,
    openVoiceSettings,
    probeCore,
    refreshCapabilities,
    refreshMemoryHealth,
    refreshModelGovernance,
    renameConversation,
    resourceDiagnostics,
    sendCommand,
    sendMessage,
    selectConversation,
    sending,
    snapshot,
  } = useJarvis()
  const [draft, setDraft] = useState("")
  const [memorySnapshotDraft, setMemorySnapshotDraft] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [conversationTitleDraft, setConversationTitleDraft] = useState("")

  const coreOnline = connection === "online"
  const ptt = usePttCapture(sendCommand, coreOnline)
  const recentEvents = useMemo(() => events.slice(0, 12), [events])
  const conversations = snapshot?.conversations ?? []
  const activeConversation =
    conversations.find((item) => item.id === snapshot?.activeConversationId) ??
    conversations[0]
  const visibleMessages =
    activeConversation && snapshot?.messages
      ? snapshot.messages.filter(
          (message) => message.conversationId === activeConversation.id
        )
      : (snapshot?.messages ?? [])
  const voiceTranscript = snapshot?.voice.transcript?.text ?? ""
  const voiceRms = `${Math.round(ptt.audioDiagnostics.rms * 100)}%`
  const voicePeak = `${Math.round(ptt.audioDiagnostics.peak * 100)}%`
  const runtimeMode =
    snapshot?.capabilities?.runtimeMode.replace("_", " ") ?? "unknown"
  const gpuCount = snapshot?.capabilities?.device.gpus.length ?? 0
  const accelerationBackends =
    snapshot?.capabilities?.device.accelerationBackends.join(", ") ?? "cpu"
  const loadedModelCount = modelInventory.filter(
    (item) => item.status === "loaded"
  ).length
  const downloadableCandidateCount = modelCandidates.filter(
    (item) => item.downloadEnabled
  ).length
  const availableInferenceProviderCount = inferenceProviders.filter(
    (item) => item.status === "available"
  ).length
  const requiredProviderConfigurationCount = inferenceProviderRequirements
    .flatMap((report) => report.requirements)
    .filter((requirement) => requirement.required && !requirement.configured)
    .length
  const installableModelCount = modelInstallabilityReports.filter(
    (item) => item.allowed
  ).length
  const blockedModelCount = modelInstallabilityReports.filter(
    (item) => !item.allowed
  ).length
  const activeModelOperationCount = modelOperations.filter((item) =>
    activeModelOperationPhases.has(item.phase)
  ).length
  const resourceMemoryGiB = formatGib(
    resourceDiagnostics?.availableMemoryBytes
  )
  const resourceVramGiB = formatGib(resourceDiagnostics?.availableVramBytes)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    const accepted = await sendMessage(text)
    if (accepted) setDraft("")
  }

  async function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeConversation || sending) return
    const title = conversationTitleDraft.trim()
    if (!title) return
    const renamed = await renameConversation(activeConversation.id, title)
    if (renamed) {
      setRenaming(false)
      setConversationTitleDraft("")
    }
  }

  async function handleExportMemorySnapshot() {
    const snapshotJson = await exportMemorySnapshot()
    if (snapshotJson) {
      setMemorySnapshotDraft(snapshotJson)
    }
  }

  async function handleImportMemorySnapshot() {
    const imported = await importMemorySnapshot(memorySnapshotDraft)
    if (imported) {
      void refreshMemoryHealth()
    }
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
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                {activeConversation?.title ?? "Primary Session"}
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                sequence {snapshot?.sequenceId ?? 0}
                {snapshot?.activeConversationId
                  ? ` / active ${snapshot.activeConversationId.slice(-8)}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {renaming && activeConversation ? (
                <form className="flex items-center gap-1.5" onSubmit={handleRenameSubmit}>
                  <Input
                    aria-label="Conversation title"
                    className="h-8 w-[180px] rounded-md text-xs"
                    data-testid="conversation-title-input"
                    onChange={(event) => setConversationTitleDraft(event.target.value)}
                    value={conversationTitleDraft}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Save conversation title"
                        className="size-8 rounded-md"
                        data-testid="save-conversation-title"
                        disabled={!conversationTitleDraft.trim() || sending}
                        size="icon-sm"
                        type="submit"
                      >
                        <Check className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save conversation title</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Cancel conversation rename"
                        className="size-8 rounded-md"
                        data-testid="cancel-conversation-rename"
                        onClick={() => {
                          setRenaming(false)
                          setConversationTitleDraft("")
                        }}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cancel conversation rename</TooltipContent>
                  </Tooltip>
                </form>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Rename conversation"
                        className="size-8 rounded-md"
                        data-testid="rename-conversation"
                        disabled={!activeConversation || sending}
                        onClick={() => {
                          setConversationTitleDraft(activeConversation?.title ?? "")
                          setRenaming(true)
                        }}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rename conversation</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="New conversation"
                        className="size-8 rounded-md"
                        data-testid="new-conversation"
                        disabled={sending}
                        onClick={() => void createConversation()}
                        size="icon-sm"
                        variant="outline"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>New conversation</TooltipContent>
                  </Tooltip>
                </>
              )}
              <Badge className="rounded-md text-[10px] text-accent" variant="secondary">
                LOCAL CONTRACT
              </Badge>
            </div>
          </div>

          <div className="flex h-[48px] shrink-0 items-center gap-2 overflow-x-auto border-b px-6">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground">No local conversations yet.</p>
            ) : (
              conversations.map((conversation) => {
                const active = conversation.id === snapshot?.activeConversationId
                return (
                  <Button
                    className={cn(
                      "h-8 max-w-[220px] shrink-0 rounded-md px-2.5 text-xs",
                      active && "border-primary text-primary"
                    )}
                    data-testid="conversation-tab"
                    disabled={sending || active}
                    key={conversation.id}
                    onClick={() => void selectConversation(conversation.id)}
                    type="button"
                    variant={active ? "outline" : "ghost"}
                  >
                    <span className="truncate">{conversation.title}</span>
                  </Button>
                )
              })
            )}
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

              {visibleMessages.map((message) => (
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
                    onClick={() => {
                      void probeCore()
                      void refreshCapabilities()
                      void refreshMemoryHealth()
                      void refreshModelGovernance()
                    }}
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
              <Metric label="RUNTIME MODE" value={runtimeMode} tone="accent" />
              <Metric
                label="MEMORY"
                value={snapshot?.memoryHealth?.status ?? "unknown"}
                tone={snapshot?.memoryHealth?.status === "degraded" ? "warning" : "success"}
              />
              <Metric label="GPU COUNT" value={String(gpuCount)} />
              <Metric label="ACCELERATION" value={accelerationBackends} />
              <Metric label="VOICE ENGINE" value={snapshot?.voice.state ?? "disabled"} tone="warning" />
              <Metric label="MIC PERMISSION" value={snapshot?.voice.permission ?? "unknown"} />
              <Metric label="VOICE FRAMES" value={String(ptt.audioDiagnostics.framesSent)} />
              <Metric label="VOICE RMS" value={voiceRms} />
              <Metric label="VOICE PEAK" value={voicePeak} />
              <Metric label="TRANSPORT" value="IPC" tone="accent" />
              <Metric label="SEQUENCE" value={String(snapshot?.sequenceId ?? 0).padStart(4, "0")} />
            </dl>

            <div className="mt-4 shrink-0" data-testid="model-governance">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Model Governance</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Refresh model governance"
                      className="size-8 rounded-md"
                      data-testid="refresh-model-governance"
                      disabled={sending}
                      onClick={() => void refreshModelGovernance()}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <RefreshCw className={cn("size-3.5", sending && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh model governance</TooltipContent>
                </Tooltip>
              </div>
              <dl className="divide-y divide-border border-y text-[11px]">
                <Metric label="CANDIDATES" value={String(modelCandidates.length)} />
                <Metric label="MANIFESTS" value={String(modelManifests.length)} />
                <Metric label="PROVIDERS" value={String(inferenceProviders.length)} />
                <Metric
                  label="AVAILABLE"
                  value={String(availableInferenceProviderCount)}
                  tone="success"
                />
                <Metric
                  label="REQUIRED"
                  value={String(requiredProviderConfigurationCount)}
                  tone="warning"
                />
                <Metric label="INSTALLABLE" value={String(installableModelCount)} tone="success" />
                <Metric label="BLOCKED" value={String(blockedModelCount)} tone="warning" />
                <Metric label="OPERATIONS" value={String(modelOperations.length)} />
                <Metric label="ACTIVE OPS" value={String(activeModelOperationCount)} tone="warning" />
                <Metric label="RESOURCE MEM" value={resourceMemoryGiB} />
                <Metric label="RESOURCE VRAM" value={resourceVramGiB} />
                <Metric
                  label="RESOURCE LEASES"
                  value={String(resourceDiagnostics?.activeLeaseCount ?? 0)}
                />
                <Metric label="LOCAL MODELS" value={String(modelInventory.length)} />
                <Metric label="DOWNLOADABLE" value={String(downloadableCandidateCount)} />
                <Metric label="LOADED" value={String(loadedModelCount)} tone="accent" />
              </dl>
            </div>

            <div className="mt-4 shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Memory Snapshot</h3>
                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Export memory snapshot"
                        className="size-8 rounded-md"
                        data-testid="export-memory-snapshot"
                        disabled={sending}
                        onClick={() => void handleExportMemorySnapshot()}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Download className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export memory snapshot</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Import memory snapshot"
                        className="size-8 rounded-md"
                        data-testid="import-memory-snapshot"
                        disabled={!memorySnapshotDraft.trim() || sending}
                        onClick={() => void handleImportMemorySnapshot()}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Upload className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Import memory snapshot</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Textarea
                aria-label="Memory snapshot JSON"
                className="h-[96px] resize-none rounded-md bg-input/45 font-mono text-[10px] leading-4"
                data-testid="memory-snapshot-json"
                onChange={(event) => setMemorySnapshotDraft(event.target.value)}
                placeholder="Memory snapshot JSON"
                spellCheck={false}
                value={memorySnapshotDraft}
              />
            </div>

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

function formatGib(value: number | undefined) {
  if (value === undefined) return "unknown"
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GiB`
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
    <div className="flex h-[42px] items-center justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right font-medium uppercase",
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
