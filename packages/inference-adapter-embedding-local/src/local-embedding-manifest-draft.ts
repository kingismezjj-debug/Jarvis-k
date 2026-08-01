import type {
  LocalModelCapability,
  ModelRuntime
} from "@jarvis-k/contracts";
import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";

export type LocalEmbeddingManifestDraftGate =
  | "model.revision"
  | "model.artifact_sha256"
  | "artifact.pins"
  | "runtime.strategy"
  | "license.redistribution_review"
  | "benchmarks.local_resource_profile";

export interface LocalEmbeddingManifestDraft {
  modelId: string;
  capability: LocalModelCapability;
  source: "huggingface";
  runtime: ModelRuntime;
  license: "Apache-2.0";
  status: "draft";
  installable: false;
  downloadEnabled: false;
  blockedGates: LocalEmbeddingManifestDraftGate[];
  reasons: string[];
}

const blockedGates: LocalEmbeddingManifestDraftGate[] = [
  "model.revision",
  "model.artifact_sha256",
  "artifact.pins",
  "runtime.strategy",
  "license.redistribution_review",
  "benchmarks.local_resource_profile"
];

export function createLocalEmbeddingManifestDraft(): LocalEmbeddingManifestDraft {
  return {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    capability: "embedding",
    source: "huggingface",
    runtime: "transformers",
    license: "Apache-2.0",
    status: "draft",
    installable: false,
    downloadEnabled: false,
    blockedGates: [...blockedGates],
    reasons: [
      "Immutable upstream revision has not been approved.",
      "Artifact SHA-256 digests have not been approved.",
      "Artifact pin plan is still blocked.",
      "Runtime strategy is still provisional.",
      "License redistribution review is still pending.",
      "Local benchmark and resource profile are still pending."
    ]
  };
}
