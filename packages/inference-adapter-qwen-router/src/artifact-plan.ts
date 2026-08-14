import { QWEN_FAST_ROUTER_MODEL_ID } from "./prompt";

export type QwenFastRouterArtifactRole =
  | "model_weights"
  | "model_config"
  | "generation_config"
  | "tokenizer_config"
  | "tokenizer_vocabulary"
  | "tokenizer_merges";

export interface QwenFastRouterArtifactPin {
  key: string;
  role: QwenFastRouterArtifactRole;
  required: boolean;
  pinned: boolean;
  revision?: string;
  sha256?: string;
  upstreamPath?: string;
  reasons: string[];
}

export interface QwenFastRouterArtifactPlan {
  modelId: typeof QWEN_FAST_ROUTER_MODEL_ID;
  status: "unpinned" | "pinned";
  downloadEnabled: false;
  artifacts: QwenFastRouterArtifactPin[];
  reasons: string[];
}

export interface QwenFastRouterApprovedArtifactDigestPin {
  key: string;
  role: QwenFastRouterArtifactRole;
  revision: string;
  sha256: string;
}

export const QWEN_FAST_ROUTER_SELECTED_REVISION =
  "c1899de289a04d12100db370d81485cdf75e47ca" as const;

export const QWEN_FAST_ROUTER_APPROVED_ARTIFACT_DIGESTS: readonly QwenFastRouterApprovedArtifactDigestPin[] =
  [
    digest(
      "config.json",
      "model_config",
      "660db3b73d788119c04535e48cf9be5f55bc3100841a718637ae695b442f27dd"
    ),
    digest(
      "generation_config.json",
      "generation_config",
      "2325da0f15bb848e018c5ae071b7943332e9f871d6b60e2ed22ca97d4cb993d2"
    ),
    digest(
      "tokenizer_config.json",
      "tokenizer_config",
      "d5d09f07b48c3086c508b30d1c9114bd1189145b74e982a265350c923acd8101"
    ),
    digest(
      "tokenizer.json",
      "tokenizer_vocabulary",
      "aeb13307a71acd8fe81861d94ad54ab689df773318809eed3cbe794b4492dae4"
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
      "model.safetensors",
      "model_weights",
      "f47f71177f32bcd101b7573ec9171e6a57f4f4d31148d38e382306f42996874b"
    )
  ];

const artifactPins: readonly Omit<
  QwenFastRouterArtifactPin,
  "pinned" | "revision" | "sha256" | "upstreamPath" | "reasons"
>[] = [
  artifact("config.json", "model_config"),
  artifact("generation_config.json", "generation_config"),
  artifact("tokenizer_config.json", "tokenizer_config"),
  artifact("tokenizer.json", "tokenizer_vocabulary"),
  artifact("merges.txt", "tokenizer_merges"),
  artifact("vocab.json", "tokenizer_vocabulary"),
  artifact("model.safetensors", "model_weights")
];

export function createQwenFastRouterArtifactPlan(): QwenFastRouterArtifactPlan {
  return {
    modelId: QWEN_FAST_ROUTER_MODEL_ID,
    status: "unpinned",
    downloadEnabled: false,
    artifacts: artifactPins.map((pin) => ({
      ...pin,
      pinned: false,
      reasons: [
        "Exact upstream revision is pending.",
        "SHA-256 digest is pending.",
        "Downloads remain disabled until every required artifact is pinned."
      ]
    })),
    reasons: [
      "Qwen3-0.6B artifact revision pins are not approved.",
      "Qwen3-0.6B artifact SHA-256 digests are not approved.",
      "Downloads remain disabled until a separate artifact pinning window approves every required file."
    ]
  };
}

export function createPinnedQwenFastRouterArtifactPlan(): QwenFastRouterArtifactPlan {
  if (QWEN_FAST_ROUTER_APPROVED_ARTIFACT_DIGESTS.length === 0) {
    return createQwenFastRouterArtifactPlan();
  }

  const artifacts = artifactPins.map((pin) => {
    const approved = QWEN_FAST_ROUTER_APPROVED_ARTIFACT_DIGESTS.find(
      (candidate) =>
        candidate.key === pin.key && candidate.role === pin.role
    );
    if (approved === undefined) {
      throw new Error(`Missing approved Qwen digest for ${pin.key}.`);
    }
    return {
      ...pin,
      pinned: true,
      revision: approved.revision,
      sha256: approved.sha256,
      upstreamPath: pin.key,
      reasons: []
    };
  });

  return {
    modelId: QWEN_FAST_ROUTER_MODEL_ID,
    status: "pinned",
    downloadEnabled: false,
    artifacts,
    reasons: [
      "Every required Qwen3-0.6B Fast Router artifact is pinned to an approved immutable revision.",
      "Every required Qwen3-0.6B Fast Router artifact has an approved SHA-256 digest.",
      "Downloads remain disabled until the separate runtime/cache acceptance window is active."
    ]
  };
}

export function isQwenFastRouterArtifactPlanPinned(
  plan: QwenFastRouterArtifactPlan
): boolean {
  return (
    plan.modelId === QWEN_FAST_ROUTER_MODEL_ID &&
    plan.status === "pinned" &&
    plan.downloadEnabled === false &&
    plan.artifacts.length === artifactPins.length &&
    plan.artifacts.every(
      (pin) =>
        pin.required &&
        pin.pinned &&
        pin.revision !== undefined &&
        pin.upstreamPath === pin.key &&
        typeof pin.sha256 === "string" &&
        /^[a-f0-9]{64}$/u.test(pin.sha256)
    )
  );
}

function artifact(
  key: string,
  role: QwenFastRouterArtifactRole
): Omit<
  QwenFastRouterArtifactPin,
  "pinned" | "revision" | "sha256" | "upstreamPath" | "reasons"
> {
  return {
    key,
    role,
    required: true
  };
}

function digest(
  key: string,
  role: QwenFastRouterArtifactRole,
  sha256: string
): QwenFastRouterApprovedArtifactDigestPin {
  return {
    key,
    role,
    revision: QWEN_FAST_ROUTER_SELECTED_REVISION,
    sha256
  };
}
