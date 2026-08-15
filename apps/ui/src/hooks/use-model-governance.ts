import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import {
  EmbeddingGenerationResultSchema,
  InferenceProviderConfigurationReportSchema,
  InferenceProviderDescriptorSchema,
  IntentRoutingResultSchema,
  OcrRecognitionResultSchema,
  RerankResultSchema,
  ModelInstallabilityReportSchema,
  ModelInventoryItemSchema,
  ModelCandidateSchema,
  ModelManifestSchema,
  ModelOperationSnapshotSchema,
  ResourceSchedulerDiagnosticsSchema,
  type EmbeddingGenerationResult,
  type InferenceProviderConfigurationReport,
  type InferenceProviderDescriptor,
  type IntentRoutingResult,
  type OcrRecognitionResult,
  type RerankResult,
  type ModelInventoryItem,
  type ModelInstallabilityReport,
  type ModelCandidate,
  type ModelManifest,
  type ModelOperationSnapshot,
  type ResourceSchedulerDiagnostics,
} from "@jarvis-k/contracts";

const FIXTURE_EMBEDDING_MODEL_ID = "jarvis-fixture/local-embedding-smoke";
const FIXTURE_INTENT_ROUTER_MODEL_ID =
  "jarvis-fixture/local-intent-router-smoke";
const FIXTURE_OCR_MODEL_ID = "jarvis-fixture/local-ocr-smoke";
const FIXTURE_RERANKER_MODEL_ID = "jarvis-fixture/local-reranker-smoke";

export type FixtureEmbeddingProbe = {
  dimensions: number;
  generatedAt: string;
  operationPhase?: ModelOperationSnapshot["phase"];
  vectorCount: number;
};

export type FixtureIntentProbe = {
  candidateCount: number;
  intent?: string;
  operationPhase?: ModelOperationSnapshot["phase"];
};

export type FixtureOcrProbe = {
  blockCount: number;
  operationPhase?: ModelOperationSnapshot["phase"];
  text: string;
};

export type FixtureRerankProbe = {
  operationPhase?: ModelOperationSnapshot["phase"];
  resultCount: number;
  topDocumentId?: string;
};

export type UseModelGovernanceOptions = {
  setError: Dispatch<SetStateAction<string | null>>;
  setSending: Dispatch<SetStateAction<boolean>>;
};

export function useModelGovernance({
  setError,
  setSending,
}: UseModelGovernanceOptions) {
  const [modelInventory, setModelInventory] = useState<ModelInventoryItem[]>(
    [],
  );
  const [modelInstallabilityReports, setModelInstallabilityReports] = useState<
    ModelInstallabilityReport[]
  >([]);
  const [modelOperations, setModelOperations] = useState<
    ModelOperationSnapshot[]
  >([]);
  const [modelCandidates, setModelCandidates] = useState<ModelCandidate[]>([]);
  const [modelManifests, setModelManifests] = useState<ModelManifest[]>([]);
  const [inferenceProviders, setInferenceProviders] = useState<
    InferenceProviderDescriptor[]
  >([]);
  const [inferenceProviderRequirements, setInferenceProviderRequirements] =
    useState<InferenceProviderConfigurationReport[]>([]);
  const [fixtureEmbeddingProbe, setFixtureEmbeddingProbe] =
    useState<FixtureEmbeddingProbe | null>(null);
  const [fixtureIntentProbe, setFixtureIntentProbe] =
    useState<FixtureIntentProbe | null>(null);
  const [fixtureOcrProbe, setFixtureOcrProbe] =
    useState<FixtureOcrProbe | null>(null);
  const [fixtureRerankProbe, setFixtureRerankProbe] =
    useState<FixtureRerankProbe | null>(null);
  const [resourceDiagnostics, setResourceDiagnostics] =
    useState<ResourceSchedulerDiagnostics | null>(null);

  const applyModelOperation = useCallback(
    (operation: ModelOperationSnapshot) => {
      setModelOperations((current) => upsertModelOperation(current, operation));
    },
    [],
  );

  const refreshModelGovernance = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    const jarvis = window.jarvis;
    setSending(true);
    try {
      const manifestsResult = await jarvis.sendCommand({
        type: "agent.listModelManifests",
        payload: {},
      });
      if (!manifestsResult.ok) {
        setError(manifestsResult.error.message);
        return false;
      }
      const manifests = ModelManifestSchema.array().safeParse(
        (manifestsResult.data as { manifests?: unknown } | undefined)
          ?.manifests,
      );
      if (!manifests.success) {
        setError("Core returned invalid model manifests.");
        return false;
      }

      const installabilityReportResults = await Promise.all(
        manifests.data.map((manifest) =>
          jarvis.sendCommand({
            type: "agent.previewModelInstallability",
            payload: {
              modelId: manifest.id,
            },
          }),
        ),
      );
      const failedInstallabilityReport = installabilityReportResults.find(
        (result) => !result.ok,
      );
      if (failedInstallabilityReport && !failedInstallabilityReport.ok) {
        setError(failedInstallabilityReport.error.message);
        return false;
      }
      const installabilityReports =
        ModelInstallabilityReportSchema.array().safeParse(
          installabilityReportResults.map((result) =>
            result.ok
              ? (result.data as { report?: unknown } | undefined)?.report
              : undefined,
          ),
        );
      if (!installabilityReports.success) {
        setError("Core returned invalid model installability reports.");
        return false;
      }

      const inventoryResult = await jarvis.sendCommand({
        type: "agent.listModelInventory",
        payload: {},
      });
      if (!inventoryResult.ok) {
        setError(inventoryResult.error.message);
        return false;
      }
      const inventory = ModelInventoryItemSchema.array().safeParse(
        (inventoryResult.data as { inventory?: unknown } | undefined)
          ?.inventory,
      );
      if (!inventory.success) {
        setError("Core returned invalid model inventory.");
        return false;
      }

      const operationsResult = await jarvis.sendCommand({
        type: "agent.listModelOperations",
        payload: {},
      });
      if (!operationsResult.ok) {
        setError(operationsResult.error.message);
        return false;
      }
      const operations = ModelOperationSnapshotSchema.array().safeParse(
        (operationsResult.data as { operations?: unknown } | undefined)
          ?.operations,
      );
      if (!operations.success) {
        setError("Core returned invalid model operations.");
        return false;
      }

      const resourceResult = await jarvis.sendCommand({
        type: "agent.getResourceDiagnostics",
        payload: {},
      });
      if (!resourceResult.ok) {
        setError(resourceResult.error.message);
        return false;
      }
      const resourceDiagnostics = ResourceSchedulerDiagnosticsSchema.safeParse(
        (resourceResult.data as { resourceDiagnostics?: unknown } | undefined)
          ?.resourceDiagnostics,
      );
      if (!resourceDiagnostics.success) {
        setError("Core returned invalid resource diagnostics.");
        return false;
      }

      const candidatesResult = await jarvis.sendCommand({
        type: "agent.listModelCandidates",
        payload: {},
      });
      if (!candidatesResult.ok) {
        setError(candidatesResult.error.message);
        return false;
      }
      const candidates = ModelCandidateSchema.array().safeParse(
        (candidatesResult.data as { candidates?: unknown } | undefined)
          ?.candidates,
      );
      if (!candidates.success) {
        setError("Core returned invalid model candidates.");
        return false;
      }

      const providersResult = await jarvis.sendCommand({
        type: "agent.listInferenceProviders",
        payload: {},
      });
      if (!providersResult.ok) {
        setError(providersResult.error.message);
        return false;
      }
      const providers = InferenceProviderDescriptorSchema.array().safeParse(
        (providersResult.data as { providers?: unknown } | undefined)
          ?.providers,
      );
      if (!providers.success) {
        setError("Core returned invalid inference provider descriptors.");
        return false;
      }

      const providerRequirementsResult = await jarvis.sendCommand({
        type: "agent.listInferenceProviderRequirements",
        payload: {},
      });
      if (!providerRequirementsResult.ok) {
        setError(providerRequirementsResult.error.message);
        return false;
      }
      const providerRequirements =
        InferenceProviderConfigurationReportSchema.array().safeParse(
          (providerRequirementsResult.data as { reports?: unknown } | undefined)
            ?.reports,
        );
      if (!providerRequirements.success) {
        setError("Core returned invalid inference provider requirements.");
        return false;
      }

      setModelManifests(manifests.data);
      setModelInstallabilityReports(installabilityReports.data);
      setModelInventory(inventory.data);
      setModelOperations(operations.data);
      setResourceDiagnostics(resourceDiagnostics.data);
      setModelCandidates(candidates.data);
      setInferenceProviders(providers.data);
      setInferenceProviderRequirements(providerRequirements.data);
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, [setError, setSending]);

  const runFixtureEmbeddingProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    const jarvis = window.jarvis;
    setSending(true);
    try {
      const result = await jarvis.sendCommand({
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
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const embeddingResult = EmbeddingGenerationResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result,
      );
      if (!embeddingResult.success) {
        setError("Core returned an invalid embedding result.");
        return false;
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation,
      );
      if (operation.success) {
        applyModelOperation(operation.data);
      }
      setFixtureEmbeddingProbe(
        toFixtureEmbeddingProbe(
          embeddingResult.data,
          operation.success ? operation.data : undefined,
        ),
      );
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, [applyModelOperation, setError, setSending]);

  const runFixtureIntentProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    const jarvis = window.jarvis;
    setSending(true);
    try {
      const result = await jarvis.sendCommand({
        type: "agent.routeIntent",
        payload: {
          modelId: FIXTURE_INTENT_ROUTER_MODEL_ID,
          utterance: "search memory",
          context: {
            locale: "en",
            allowedIntents: ["memory.search"],
          },
        },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const intentResult = IntentRoutingResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result,
      );
      if (!intentResult.success) {
        setError("Core returned an invalid intent routing result.");
        return false;
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation,
      );
      if (operation.success) {
        applyModelOperation(operation.data);
      }
      setFixtureIntentProbe(
        toFixtureIntentProbe(
          intentResult.data,
          operation.success ? operation.data : undefined,
        ),
      );
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, [applyModelOperation, setError, setSending]);

  const runFixtureOcrProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    const jarvis = window.jarvis;
    setSending(true);
    try {
      const result = await jarvis.sendCommand({
        type: "agent.recognizeOcr",
        payload: {
          modelId: FIXTURE_OCR_MODEL_ID,
          image: {
            id: "fixture-ui-image",
            mimeType: "image/png",
            bytes: new Uint8Array([137, 80, 78, 71]),
            width: 1,
            height: 1,
          },
        },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const ocrResult = OcrRecognitionResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result,
      );
      if (!ocrResult.success) {
        setError("Core returned an invalid OCR result.");
        return false;
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation,
      );
      if (operation.success) {
        applyModelOperation(operation.data);
      }
      setFixtureOcrProbe(
        toFixtureOcrProbe(
          ocrResult.data,
          operation.success ? operation.data : undefined,
        ),
      );
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, [applyModelOperation, setError, setSending]);

  const runFixtureRerankProbe = useCallback(async () => {
    if (!window.jarvis) {
      setError("Desktop bridge unavailable.");
      return false;
    }

    const jarvis = window.jarvis;
    setSending(true);
    try {
      const result = await jarvis.sendCommand({
        type: "agent.rerank",
        payload: {
          modelId: FIXTURE_RERANKER_MODEL_ID,
          query: "model ports",
          documents: [
            {
              id: "doc-model-ports",
              metadata: {},
              text: "Core uses injected model ports for inference.",
            },
            {
              id: "doc-voice-settings",
              metadata: {},
              text: "Desktop owns safeStorage voice settings.",
            },
          ],
          topK: 1,
        },
      });
      if (!result.ok) {
        setError(result.error.message);
        return false;
      }
      const rerankResult = RerankResultSchema.safeParse(
        (result.data as { result?: unknown } | undefined)?.result,
      );
      if (!rerankResult.success) {
        setError("Core returned an invalid rerank result.");
        return false;
      }
      const operation = ModelOperationSnapshotSchema.safeParse(
        (result.data as { operation?: unknown } | undefined)?.operation,
      );
      if (operation.success) {
        applyModelOperation(operation.data);
      }
      setFixtureRerankProbe(
        toFixtureRerankProbe(
          rerankResult.data,
          operation.success ? operation.data : undefined,
        ),
      );
      setError(null);
      return true;
    } finally {
      setSending(false);
    }
  }, [applyModelOperation, setError, setSending]);

  return {
    applyModelOperation,
    fixtureEmbeddingProbe,
    fixtureIntentProbe,
    fixtureOcrProbe,
    fixtureRerankProbe,
    inferenceProviderRequirements,
    inferenceProviders,
    modelCandidates,
    modelInstallabilityReports,
    modelInventory,
    modelManifests,
    modelOperations,
    refreshModelGovernance,
    resourceDiagnostics,
    runFixtureEmbeddingProbe,
    runFixtureIntentProbe,
    runFixtureOcrProbe,
    runFixtureRerankProbe,
  };
}

function toFixtureEmbeddingProbe(
  result: EmbeddingGenerationResult,
  operation: ModelOperationSnapshot | undefined,
): FixtureEmbeddingProbe {
  return {
    dimensions: result.dimensions,
    generatedAt: result.generatedAt,
    ...(operation ? { operationPhase: operation.phase } : {}),
    vectorCount: result.vectors.length,
  };
}

function toFixtureIntentProbe(
  result: IntentRoutingResult,
  operation: ModelOperationSnapshot | undefined,
): FixtureIntentProbe {
  const firstCandidate = result.candidates[0];
  return {
    candidateCount: result.candidates.length,
    ...(firstCandidate ? { intent: firstCandidate.intent } : {}),
    ...(operation ? { operationPhase: operation.phase } : {}),
  };
}

function toFixtureOcrProbe(
  result: OcrRecognitionResult,
  operation: ModelOperationSnapshot | undefined,
): FixtureOcrProbe {
  return {
    blockCount: result.blocks.length,
    ...(operation ? { operationPhase: operation.phase } : {}),
    text: result.text,
  };
}

function toFixtureRerankProbe(
  result: RerankResult,
  operation: ModelOperationSnapshot | undefined,
): FixtureRerankProbe {
  const top = result.results[0];
  return {
    ...(operation ? { operationPhase: operation.phase } : {}),
    resultCount: result.results.length,
    ...(top ? { topDocumentId: top.documentId } : {}),
  };
}

function upsertModelOperation(
  current: ModelOperationSnapshot[],
  operation: ModelOperationSnapshot,
): ModelOperationSnapshot[] {
  const existingIndex = current.findIndex(
    (item) => item.operationId === operation.operationId,
  );
  if (existingIndex < 0) return [operation, ...current];
  return current.map((item, index) =>
    index === existingIndex ? operation : item,
  );
}
