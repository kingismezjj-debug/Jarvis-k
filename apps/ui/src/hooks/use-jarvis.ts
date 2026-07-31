import { useCallback, useEffect, useState } from "react"
import {
  CoreSnapshotSchema,
  EmbeddingGenerationResultSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  IntentRoutingResultSchema,
  ModelInstallabilityReportSchema,
  ModelInventoryItemSchema,
  ModelCandidateSchema,
  ModelManifestSchema,
  ModelOperationSnapshotSchema,
  MemorySnapshotSchema,
  ResourceSchedulerDiagnosticsSchema,
  type AppCommand,
  type CoreSnapshot,
  type EmbeddingGenerationResult,
  type EventEnvelope,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type IntentRoutingResult,
  type ModelInventoryItem,
  type ModelInstallabilityReport,
  type ModelCandidate,
  type ModelManifest,
  type ModelOperationSnapshot,
  type ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts"

type CoreConnection = "connecting" | "online" | "restarting" | "offline"

const MAX_EVENTS = 40
const FIXTURE_EMBEDDING_MODEL_ID = "jarvis-fixture/local-embedding-smoke"
const FIXTURE_INTENT_ROUTER_MODEL_ID =
  "jarvis-fixture/local-intent-router-smoke"

export type FixtureEmbeddingProbe = {
  dimensions: number
  generatedAt: string
  operationPhase?: ModelOperationSnapshot["phase"]
  vectorCount: number
}

export type FixtureIntentProbe = {
  candidateCount: number
  intent?: string
  operationPhase?: ModelOperationSnapshot["phase"]
}

export function useJarvis() {
  const [snapshot, setSnapshot] = useState<CoreSnapshot | null>(null)
  const [events, setEvents] = useState<EventEnvelope[]>([])
  const [connection, setConnection] = useState<CoreConnection>("connecting")
  const [error, setError] = useState<string | null>(null)
  const [modelInventory, setModelInventory] = useState<ModelInventoryItem[]>([])
  const [modelInstallabilityReports, setModelInstallabilityReports] = useState<
    ModelInstallabilityReport[]
  >([])
  const [modelOperations, setModelOperations] = useState<ModelOperationSnapshot[]>([])
  const [modelCandidates, setModelCandidates] = useState<ModelCandidate[]>([])
  const [modelManifests, setModelManifests] = useState<ModelManifest[]>([])
  const [inferenceProviders, setInferenceProviders] = useState<
    InferenceProviderDescriptor[]
  >([])
  const [inferenceProviderRequirements, setInferenceProviderRequirements] =
    useState<InferenceProviderConfigurationReport[]>([])
  const [fixtureEmbeddingProbe, setFixtureEmbeddingProbe] =
    useState<FixtureEmbeddingProbe | null>(null)
  const [fixtureIntentProbe, setFixtureIntentProbe] =
    useState<FixtureIntentProbe | null>(null)
  const [resourceDiagnostics, setResourceDiagnostics] =
    useState<ResourceSchedulerDiagnostics | null>(null)
  const [sending, setSending] = useState(false)

  const applyEvent = useCallback((envelope: EventEnvelope) => {
    setEvents((current) => [envelope, ...current].slice(0, MAX_EVENTS))

    if (envelope.event.type === "state.snapshot") {
      setSnapshot(envelope.event.payload)
      setConnection("online")
      setError(null)
    }

    if (envelope.event.type === "model.operation.updated") {
      const operation = envelope.event.payload
      setModelOperations((current) => upsertModelOperation(current, operation))
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
          text,
        },
      }),
    [sendCommand]
  )

  const createConversation = useCallback(
    async () =>
      sendCommand({
        type: "agent.createConversation",
        payload: {},
      }),
    [sendCommand]
  )

  const selectConversation = useCallback(
    async (conversationId: string) =>
      sendCommand({
        type: "agent.selectConversation",
        payload: { conversationId },
      }),
    [sendCommand]
  )

  const renameConversation = useCallback(
    async (conversationId: string, title: string) =>
      sendCommand({
        type: "agent.renameConversation",
        payload: { conversationId, title },
      }),
    [sendCommand]
  )

  const refreshMemoryHealth = useCallback(
    async () =>
      sendCommand({
        type: "agent.getMemoryHealth",
        payload: {},
      }),
    [sendCommand]
  )

  const refreshCapabilities = useCallback(
    async () =>
      sendCommand({
        type: "agent.getCapabilities",
        payload: {},
      }),
    [sendCommand]
  )

  const refreshModelGovernance = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.")
      return false
    }

    setSending(true)
    try {
      const manifestsResult = await window.jarvis.sendCommand({
        type: "agent.listModelManifests",
        payload: {},
      })
      if (!manifestsResult.ok) {
        setError(manifestsResult.error.message)
        return false
      }
      const manifests = ModelManifestSchema.array().safeParse(
        (manifestsResult.data as { manifests?: unknown } | undefined)?.manifests
      )
      if (!manifests.success) {
        setError("Core returned invalid model manifests.")
        return false
      }

      const installabilityReportResults = await Promise.all(
        manifests.data.map((manifest) =>
          window.jarvis.sendCommand({
            type: "agent.previewModelInstallability",
            payload: {
              modelId: manifest.id,
            },
          })
        )
      )
      const failedInstallabilityReport = installabilityReportResults.find(
        (result) => !result.ok
      )
      if (failedInstallabilityReport && !failedInstallabilityReport.ok) {
        setError(failedInstallabilityReport.error.message)
        return false
      }
      const installabilityReports = ModelInstallabilityReportSchema.array().safeParse(
        installabilityReportResults.map(
          (result) =>
            result.ok
              ? (result.data as { report?: unknown } | undefined)?.report
              : undefined
        )
      )
      if (!installabilityReports.success) {
        setError("Core returned invalid model installability reports.")
        return false
      }

      const inventoryResult = await window.jarvis.sendCommand({
        type: "agent.listModelInventory",
        payload: {},
      })
      if (!inventoryResult.ok) {
        setError(inventoryResult.error.message)
        return false
      }
      const inventory = ModelInventoryItemSchema.array().safeParse(
        (inventoryResult.data as { inventory?: unknown } | undefined)?.inventory
      )
      if (!inventory.success) {
        setError("Core returned invalid model inventory.")
        return false
      }

      const operationsResult = await window.jarvis.sendCommand({
        type: "agent.listModelOperations",
        payload: {},
      })
      if (!operationsResult.ok) {
        setError(operationsResult.error.message)
        return false
      }
      const operations = ModelOperationSnapshotSchema.array().safeParse(
        (operationsResult.data as { operations?: unknown } | undefined)?.operations
      )
      if (!operations.success) {
        setError("Core returned invalid model operations.")
        return false
      }

      const resourceResult = await window.jarvis.sendCommand({
        type: "agent.getResourceDiagnostics",
        payload: {},
      })
      if (!resourceResult.ok) {
        setError(resourceResult.error.message)
        return false
      }
      const resourceDiagnostics = ResourceSchedulerDiagnosticsSchema.safeParse(
        (resourceResult.data as { resourceDiagnostics?: unknown } | undefined)
          ?.resourceDiagnostics
      )
      if (!resourceDiagnostics.success) {
        setError("Core returned invalid resource diagnostics.")
        return false
      }

      const candidatesResult = await window.jarvis.sendCommand({
        type: "agent.listModelCandidates",
        payload: {},
      })
      if (!candidatesResult.ok) {
        setError(candidatesResult.error.message)
        return false
      }
      const candidates = ModelCandidateSchema.array().safeParse(
        (candidatesResult.data as { candidates?: unknown } | undefined)?.candidates
      )
      if (!candidates.success) {
        setError("Core returned invalid model candidates.")
        return false
      }

      const providersResult = await window.jarvis.sendCommand({
        type: "agent.listInferenceProviders",
        payload: {},
      })
      if (!providersResult.ok) {
        setError(providersResult.error.message)
        return false
      }
      const providers = InferenceProviderDescriptorSchema.array().safeParse(
        (providersResult.data as { providers?: unknown } | undefined)?.providers
      )
      if (!providers.success) {
        setError("Core returned invalid inference provider descriptors.")
        return false
      }

      const providerRequirementsResult = await window.jarvis.sendCommand({
        type: "agent.listInferenceProviderRequirements",
        payload: {},
      })
      if (!providerRequirementsResult.ok) {
        setError(providerRequirementsResult.error.message)
        return false
      }
      const providerRequirements =
        InferenceProviderConfigurationReportSchema.array().safeParse(
          (providerRequirementsResult.data as { reports?: unknown } | undefined)?.reports
        )
      if (!providerRequirements.success) {
        setError("Core returned invalid inference provider requirements.")
        return false
      }

      setModelManifests(manifests.data)
      setModelInstallabilityReports(installabilityReports.data)
      setModelInventory(inventory.data)
      setModelOperations(operations.data)
      setResourceDiagnostics(resourceDiagnostics.data)
      setModelCandidates(candidates.data)
      setInferenceProviders(providers.data)
      setInferenceProviderRequirements(providerRequirements.data)
      setError(null)
      return true
    } finally {
      setSending(false)
    }
  }, [])

  const runFixtureEmbeddingProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.")
      return false
    }

    setSending(true)
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.generateEmbeddings",
        payload: {
          modelId: FIXTURE_EMBEDDING_MODEL_ID,
          inputs: [
            {
              id: "fixture-ui-probe",
              text: "Jarvis-K fixture embedding probe",
            },
          ],
          dimensions: 4,
        },
      })
      if (!result.ok) {
        setError(result.error.message)
        return false
      }
      const embeddingResult = EmbeddingGenerationResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result
      )
      if (!embeddingResult.success) {
        setError("Core returned an invalid embedding result.")
        return false
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation
      )
      if (operation.success) {
        setModelOperations((current) =>
          upsertModelOperation(current, operation.data)
        )
      }
      setFixtureEmbeddingProbe(toFixtureEmbeddingProbe(
        embeddingResult.data,
        operation.success ? operation.data : undefined
      ))
      setError(null)
      return true
    } finally {
      setSending(false)
    }
  }, [])

  const runFixtureIntentProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.")
      return false
    }

    setSending(true)
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.routeIntent",
        payload: {
          modelId: FIXTURE_INTENT_ROUTER_MODEL_ID,
          utterance: "search memory",
          context: {
            locale: "en",
            allowedIntents: ["memory.search"],
          },
        },
      })
      if (!result.ok) {
        setError(result.error.message)
        return false
      }
      const intentResult = IntentRoutingResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result
      )
      if (!intentResult.success) {
        setError("Core returned an invalid intent routing result.")
        return false
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation
      )
      if (operation.success) {
        setModelOperations((current) =>
          upsertModelOperation(current, operation.data)
        )
      }
      setFixtureIntentProbe(
        toFixtureIntentProbe(
          intentResult.data,
          operation.success ? operation.data : undefined
        )
      )
      setError(null)
      return true
    } finally {
      setSending(false)
    }
  }, [])

  const exportMemorySnapshot = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.")
      return null
    }

    setSending(true)
    try {
      const result = await window.jarvis.sendCommand({
        type: "agent.exportMemorySnapshot",
        payload: {},
      })
      if (!result.ok) {
        setError(result.error.message)
        return null
      }
      const snapshot = MemorySnapshotSchema.safeParse(
        (result.data as { snapshot?: unknown } | undefined)?.snapshot
      )
      if (!snapshot.success) {
        setError("Core returned an invalid memory snapshot.")
        return null
      }
      setError(null)
      return JSON.stringify(snapshot.data, null, 2)
    } finally {
      setSending(false)
    }
  }, [])

  const importMemorySnapshot = useCallback(
    async (snapshotJson: string) => {
      let snapshot: ReturnType<typeof MemorySnapshotSchema.parse>
      try {
        snapshot = MemorySnapshotSchema.parse(JSON.parse(snapshotJson))
      } catch {
        setError("Memory snapshot JSON is invalid.")
        return false
      }
      return sendCommand({
        type: "agent.importMemorySnapshot",
        payload: { snapshot },
      })
    },
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
    createConversation,
    events,
    exportMemorySnapshot,
    fixtureEmbeddingProbe,
    fixtureIntentProbe,
    importMemorySnapshot,
    inferenceProviderRequirements,
    inferenceProviders,
    modelCandidates,
    modelInventory,
    modelInstallabilityReports,
    modelManifests,
    modelOperations,
    openVoiceSettings,
    probeCore,
    refreshCapabilities,
    refreshMemoryHealth,
    refreshModelGovernance,
    refreshSnapshot,
    renameConversation,
    resourceDiagnostics,
    runFixtureEmbeddingProbe,
    runFixtureIntentProbe,
    sendCommand,
    sendMessage,
    selectConversation,
    sending,
    snapshot,
  }
}

function toFixtureEmbeddingProbe(
  result: EmbeddingGenerationResult,
  operation: ModelOperationSnapshot | undefined
): FixtureEmbeddingProbe {
  return {
    dimensions: result.dimensions,
    generatedAt: result.generatedAt,
    ...(operation ? { operationPhase: operation.phase } : {}),
    vectorCount: result.vectors.length,
  }
}

function toFixtureIntentProbe(
  result: IntentRoutingResult,
  operation: ModelOperationSnapshot | undefined
): FixtureIntentProbe {
  const firstCandidate = result.candidates[0]
  return {
    candidateCount: result.candidates.length,
    ...(firstCandidate ? { intent: firstCandidate.intent } : {}),
    ...(operation ? { operationPhase: operation.phase } : {}),
  }
}

function upsertModelOperation(
  current: ModelOperationSnapshot[],
  operation: ModelOperationSnapshot
): ModelOperationSnapshot[] {
  const existingIndex = current.findIndex(
    (item) => item.operationId === operation.operationId
  )
  if (existingIndex < 0) return [operation, ...current]
  return current.map((item, index) =>
    index === existingIndex ? operation : item
  )
}
