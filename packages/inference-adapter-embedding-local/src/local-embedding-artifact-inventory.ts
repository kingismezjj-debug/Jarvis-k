import {
  createLocalEmbeddingArtifactPlan,
  type LocalEmbeddingArtifactRole
} from "./local-embedding-artifact-plan";
import {
  LOCAL_EMBEDDING_MODEL_ID,
  LOCAL_EMBEDDING_PROVIDER_ID
} from "./local-embedding-constants";
import { LOCAL_EMBEDDING_SELECTED_REVISION } from "./local-embedding-revision-approval";

export type LocalEmbeddingArtifactInventoryDecision =
  | "required_for_pinning"
  | "deferred_review";

export type LocalEmbeddingArtifactInventoryRole =
  | LocalEmbeddingArtifactRole
  | "repository_metadata"
  | "documentation"
  | "sentence_transformers_config"
  | "sentence_transformers_modules"
  | "tokenizer_merges"
  | "generation_config";

export interface LocalEmbeddingArtifactInventoryItem {
  path: string;
  role: LocalEmbeddingArtifactInventoryRole;
  decision: LocalEmbeddingArtifactInventoryDecision;
  digestRecorded: false;
  downloadEnabled: false;
  reasons: string[];
}

export interface LocalEmbeddingArtifactInventory {
  provider: string;
  modelId: string;
  source: "huggingface";
  revision: string;
  status: "inventory_confirmed";
  downloadEnabled: false;
  pinningEnabled: false;
  digestValuesExposed: false;
  artifacts: LocalEmbeddingArtifactInventoryItem[];
  reasons: string[];
}

const observedArtifacts: LocalEmbeddingArtifactInventoryItem[] = [
  deferred(".gitattributes", "repository_metadata"),
  required("1_Pooling/config.json", "pooling_config"),
  required("config.json", "model_config"),
  deferred("config_sentence_transformers.json", "sentence_transformers_config"),
  deferred("generation_config.json", "generation_config"),
  deferred("merges.txt", "tokenizer_merges"),
  required("model.safetensors", "model_weights"),
  deferred("modules.json", "sentence_transformers_modules"),
  deferred("README.md", "documentation"),
  required("tokenizer.json", "tokenizer_vocabulary"),
  required("tokenizer_config.json", "tokenizer_config"),
  deferred("vocab.json", "tokenizer_vocabulary")
];

export function createLocalEmbeddingArtifactInventory(): LocalEmbeddingArtifactInventory {
  return {
    provider: LOCAL_EMBEDDING_PROVIDER_ID,
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    source: "huggingface",
    revision: LOCAL_EMBEDDING_SELECTED_REVISION,
    status: "inventory_confirmed",
    downloadEnabled: false,
    pinningEnabled: false,
    digestValuesExposed: false,
    artifacts: observedArtifacts.map((artifact) => ({
      ...artifact,
      reasons: [...artifact.reasons]
    })),
    reasons: [
      "Artifact roles are inventoried from the selected upstream revision.",
      "SHA-256 digests are deferred to the artifact pinning wave.",
      "Downloads remain disabled until every required artifact pin is approved."
    ]
  };
}

export function isLocalEmbeddingArtifactInventoryReadyForPinning(
  inventory: LocalEmbeddingArtifactInventory
): boolean {
  const requiredPlanPaths = createLocalEmbeddingArtifactPlan().artifacts.map(
    (artifact) => artifact.key
  );
  const inventoryPaths = new Set(
    inventory.artifacts.map((artifact) => artifact.path)
  );

  return (
    inventory.provider === LOCAL_EMBEDDING_PROVIDER_ID &&
    inventory.modelId === LOCAL_EMBEDDING_MODEL_ID &&
    inventory.source === "huggingface" &&
    inventory.revision === LOCAL_EMBEDDING_SELECTED_REVISION &&
    inventory.status === "inventory_confirmed" &&
    inventory.downloadEnabled === false &&
    inventory.pinningEnabled === false &&
    inventory.digestValuesExposed === false &&
    inventory.artifacts.length > 0 &&
    inventory.artifacts.every(
      (artifact) =>
        artifact.digestRecorded === false &&
        artifact.downloadEnabled === false
    ) &&
    requiredPlanPaths.every((path) => inventoryPaths.has(path))
  );
}

function required(
  path: string,
  role: LocalEmbeddingArtifactInventoryRole
): LocalEmbeddingArtifactInventoryItem {
  return {
    path,
    role,
    decision: "required_for_pinning",
    digestRecorded: false,
    downloadEnabled: false,
    reasons: ["Required artifact path must be pinned in a later digest wave."]
  };
}

function deferred(
  path: string,
  role: LocalEmbeddingArtifactInventoryRole
): LocalEmbeddingArtifactInventoryItem {
  return {
    path,
    role,
    decision: "deferred_review",
    digestRecorded: false,
    downloadEnabled: false,
    reasons: ["Observed upstream path remains under review for pinning scope."]
  };
}
