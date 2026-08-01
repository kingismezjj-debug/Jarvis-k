import { LOCAL_EMBEDDING_MODEL_ID } from "./local-embedding-constants";
import { LOCAL_EMBEDDING_SELECTED_REVISION } from "./local-embedding-revision-approval";

export type LocalEmbeddingArtifactRole =
  | "model_weights"
  | "model_config"
  | "generation_config"
  | "sentence_transformers_config"
  | "sentence_transformers_modules"
  | "tokenizer_config"
  | "tokenizer_merges"
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

export interface LocalEmbeddingApprovedArtifactDigestPin {
  key: string;
  role: LocalEmbeddingArtifactRole;
  revision: string;
  sha256: string;
}

export const LOCAL_EMBEDDING_APPROVED_ARTIFACT_DIGESTS: readonly LocalEmbeddingApprovedArtifactDigestPin[] =
  [
    digest(
      "model.safetensors",
      "model_weights",
      "0437e45c94563b09e13cb7a64478fc406947a93cb34a7e05870fc8dcd48e23fd"
    ),
    digest(
      "config.json",
      "model_config",
      "b5bf1f51fc45be473a54718cef92448d90a1be001bf9b9a44b8c7f10a19feaa9"
    ),
    digest(
      "config_sentence_transformers.json",
      "sentence_transformers_config",
      "10667c72ddb772627bf1780cb7f86af8e2ae0032b8c243c731172064105c6961"
    ),
    digest(
      "generation_config.json",
      "generation_config",
      "28396d421a2108acce96383f6a7de78008f7f1b17f807958f3c14c51dbfb65fb"
    ),
    digest(
      "modules.json",
      "sentence_transformers_modules",
      "84e40c8e006c9b1d6c122e02cba9b02458120b5fb0c87b746c41e0207cf642cf"
    ),
    digest(
      "tokenizer_config.json",
      "tokenizer_config",
      "253153d0738ceb4c668d2eff957714dd2bea0b56de772a9fdccd96cbf517e6a0"
    ),
    digest(
      "tokenizer.json",
      "tokenizer_vocabulary",
      "def76fb086971c7867b829c23a26261e38d9d74e02139253b38aeb9df8b4b50a"
    ),
    digest(
      "merges.txt",
      "tokenizer_merges",
      "8831e4f1a044471340f7c0a83d7bd71306a5b867e95fd870f74d0c5308a904d5"
    ),
    digest(
      "vocab.json",
      "tokenizer_vocabulary",
      "ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910"
    ),
    digest(
      "1_Pooling/config.json",
      "pooling_config",
      "37bf193fa101f19101bfad9c31d3eb0f786e247b7b1e5cb7f007d730eed1ddbd"
    )
  ];

const artifactPins: LocalEmbeddingArtifactPin[] = [
  artifact("model.safetensors", "model_weights"),
  artifact("config.json", "model_config"),
  artifact("config_sentence_transformers.json", "sentence_transformers_config"),
  artifact("generation_config.json", "generation_config"),
  artifact("modules.json", "sentence_transformers_modules"),
  artifact("tokenizer_config.json", "tokenizer_config"),
  artifact("tokenizer.json", "tokenizer_vocabulary"),
  artifact("merges.txt", "tokenizer_merges"),
  artifact("vocab.json", "tokenizer_vocabulary"),
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

export function createPinnedLocalEmbeddingArtifactPlan(): LocalEmbeddingArtifactPlan {
  const artifacts = artifactPins.map((pin) => {
    const approvedDigest = findApprovedDigest(pin);
    return {
      ...pin,
      pinned: true,
      revision: approvedDigest.revision,
      sha256: approvedDigest.sha256,
      upstreamPath: pin.key,
      reasons: []
    };
  });
  return {
    modelId: LOCAL_EMBEDDING_MODEL_ID,
    status: "pinned",
    downloadEnabled: false,
    artifacts,
    reasons: [
      "Every required artifact is pinned to the approved immutable revision.",
      "Every required artifact has an approved SHA-256 digest.",
      "Downloads remain disabled until later runtime and packaging gates are approved."
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

function digest(
  key: string,
  role: LocalEmbeddingArtifactRole,
  sha256: string
): LocalEmbeddingApprovedArtifactDigestPin {
  return {
    key,
    role,
    revision: LOCAL_EMBEDDING_SELECTED_REVISION,
    sha256
  };
}

function findApprovedDigest(
  artifactPin: LocalEmbeddingArtifactPin
): LocalEmbeddingApprovedArtifactDigestPin {
  const approvedDigest = LOCAL_EMBEDDING_APPROVED_ARTIFACT_DIGESTS.find(
    (candidate) =>
      candidate.key === artifactPin.key && candidate.role === artifactPin.role
  );

  if (approvedDigest === undefined) {
    throw new Error(`Missing approved digest for ${artifactPin.key}.`);
  }

  return approvedDigest;
}
