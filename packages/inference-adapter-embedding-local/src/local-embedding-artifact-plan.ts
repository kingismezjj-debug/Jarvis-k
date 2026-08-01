import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";

export type LocalEmbeddingArtifactRole =
  | "model_weights"
  | "model_config"
  | "tokenizer_config"
  | "tokenizer_vocabulary"
  | "pooling_config";

export interface LocalEmbeddingArtifactPin {
  key: string;
  role: LocalEmbeddingArtifactRole;
  required: boolean;
  pinned: boolean;
  revision?: string;
  sha256?: string;
  upstreamPath?: string;
  reasons: string[];
}

export interface LocalEmbeddingArtifactPlan {
  modelId: string;
  status: "unpinned" | "pinned";
  downloadEnabled: false;
  artifacts: LocalEmbeddingArtifactPin[];
  reasons: string[];
}

const artifactPins: LocalEmbeddingArtifactPin[] = [
  artifact("model.safetensors", "model_weights"),
  artifact("config.json", "model_config"),
  artifact("tokenizer_config.json", "tokenizer_config"),
  artifact("tokenizer.json", "tokenizer_vocabulary"),
  artifact("1_Pooling/config.json", "pooling_config")
];

export function createLocalEmbeddingArtifactPlan(): LocalEmbeddingArtifactPlan {
  const artifacts = artifactPins.map((pin) => ({
    ...pin,
    reasons: [...pin.reasons]
  }));
  return {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    status: "unpinned",
    downloadEnabled: false,
    artifacts,
    reasons: [
      "Artifact revision pins are not approved.",
      "Artifact SHA-256 digests are not approved.",
      "Downloads remain disabled until every required artifact is pinned."
    ]
  };
}

export function isLocalEmbeddingArtifactPlanPinned(
  plan: LocalEmbeddingArtifactPlan
): boolean {
  return (
    plan.artifacts.length > 0 &&
    plan.artifacts.every(
      (artifactPin) =>
        !artifactPin.required ||
        (artifactPin.pinned &&
          artifactPin.revision !== undefined &&
          artifactPin.sha256 !== undefined &&
          /^[a-f0-9]{64}$/.test(artifactPin.sha256))
    )
  );
}

function artifact(
  key: string,
  role: LocalEmbeddingArtifactRole
): LocalEmbeddingArtifactPin {
  return {
    key,
    role,
    required: true,
    pinned: false,
    reasons: [
      "Exact upstream revision is pending.",
      "SHA-256 digest is pending."
    ]
  };
}
