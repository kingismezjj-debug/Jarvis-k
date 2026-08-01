import {
  createLocalEmbeddingArtifactInventory,
  type LocalEmbeddingArtifactInventory,
  type LocalEmbeddingArtifactInventoryRole
} from "./local-embedding-artifact-inventory";
import { createLocalEmbeddingArtifactPlan } from "./local-embedding-artifact-plan";
import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import { LOCAL_EMBEDDING_SELECTED_REVISION } from "./local-embedding-revision-approval";

export type LocalEmbeddingArtifactRequiredSetDecision =
  | "required_for_pinning"
  | "excluded_from_runtime_pin";

export interface LocalEmbeddingArtifactRequiredSetItem {
  path: string;
  role: LocalEmbeddingArtifactInventoryRole;
  decision: LocalEmbeddingArtifactRequiredSetDecision;
  digestRecorded: false;
  downloadEnabled: false;
  reasons: string[];
}

export interface LocalEmbeddingArtifactRequiredSetDecisionRecord {
  provider: string;
  modelId: string;
  source: "huggingface";
  revision: string;
  status: "required_set_confirmed";
  downloadEnabled: false;
  pinningEnabled: false;
  digestValuesExposed: false;
  items: LocalEmbeddingArtifactRequiredSetItem[];
  reasons: string[];
}

const requiredPaths = new Set(
  createLocalEmbeddingArtifactPlan().artifacts.map((artifact) => artifact.key)
);

export function createLocalEmbeddingArtifactRequiredSetDecision(
  inventory: LocalEmbeddingArtifactInventory =
    createLocalEmbeddingArtifactInventory()
): LocalEmbeddingArtifactRequiredSetDecisionRecord {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    source: "huggingface",
    revision: LOCAL_EMBEDDING_SELECTED_REVISION,
    status: "required_set_confirmed",
    downloadEnabled: false,
    pinningEnabled: false,
    digestValuesExposed: false,
    items: inventory.artifacts.map((artifact) =>
      requiredPaths.has(artifact.path)
        ? required(artifact.path, artifact.role)
        : excluded(artifact.path, artifact.role)
    ),
    reasons: [
      "Required artifact paths are decided for the selected revision.",
      "SHA-256 digests are deferred to a later artifact pinning wave.",
      "Downloads remain disabled until every required artifact pin is approved."
    ]
  };
}

export function isLocalEmbeddingArtifactRequiredSetReadyForDigestPinning(
  decision: LocalEmbeddingArtifactRequiredSetDecisionRecord
): boolean {
  const requiredDecisionPaths = new Set(
    decision.items
      .filter((item) => item.decision === "required_for_pinning")
      .map((item) => item.path)
  );

  return (
    decision.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
    decision.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    decision.source === "huggingface" &&
    decision.revision === LOCAL_EMBEDDING_SELECTED_REVISION &&
    decision.status === "required_set_confirmed" &&
    decision.downloadEnabled === false &&
    decision.pinningEnabled === false &&
    decision.digestValuesExposed === false &&
    decision.items.length > 0 &&
    decision.items.every(
      (item) =>
        item.digestRecorded === false && item.downloadEnabled === false
    ) &&
    createLocalEmbeddingArtifactPlan().artifacts.every((artifact) =>
      requiredDecisionPaths.has(artifact.key)
    )
  );
}

function required(
  path: string,
  role: LocalEmbeddingArtifactInventoryRole
): LocalEmbeddingArtifactRequiredSetItem {
  return {
    path,
    role,
    decision: "required_for_pinning",
    digestRecorded: false,
    downloadEnabled: false,
    reasons: ["Required for runtime reproduction and later digest pinning."]
  };
}

function excluded(
  path: string,
  role: LocalEmbeddingArtifactInventoryRole
): LocalEmbeddingArtifactRequiredSetItem {
  return {
    path,
    role,
    decision: "excluded_from_runtime_pin",
    digestRecorded: false,
    downloadEnabled: false,
    reasons: ["Not required for runtime artifact pinning."]
  };
}
