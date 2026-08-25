import {
  GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
  GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
  GLM_RUNTIME_HEAVY_PLANNER_ORIGIN,
  GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID
} from "./provider";

export const GLM_STANDARD_PAAS_V4_ORIGIN =
  "https://open.bigmodel.cn/api/paas/v4";
export const GLM_STANDARD_PAAS_V4_ENDPOINT =
  `${GLM_STANDARD_PAAS_V4_ORIGIN}/chat/completions`;

export type GlmProviderOriginProfileId =
  | "coding_paas_v4"
  | "standard_paas_v4";

export type GlmProviderModelCandidateId =
  | "glm-4.7"
  | "glm-4.7-flash"
  | "glm-4.7-flashx"
  | "glm-5-turbo"
  | "glm-5.2"
  | "glm-5.3";

export type GlmProviderOriginProfileStatus =
  | "prior_timeout_evidence"
  | "candidate";

export interface GlmProviderModelOriginProfile {
  readonly providerId: typeof GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID;
  readonly profileId: GlmProviderOriginProfileId;
  readonly status: GlmProviderOriginProfileStatus;
  readonly origin: string;
  readonly endpoint: string;
  readonly defaultModelId: GlmProviderModelCandidateId;
  readonly candidateModelIds: readonly GlmProviderModelCandidateId[];
  readonly runtimeDefaultEnabled: false;
  readonly networkAccessApproved: false;
  readonly credentialAccessApproved: false;
  readonly healthDiagnosticApproved: false;
  readonly heavyPlannerAcceptanceApproved: false;
}

const GLM_LOW_LATENCY_MODEL_CANDIDATES = [
  "glm-4.7-flash",
  "glm-4.7-flashx"
] as const satisfies readonly GlmProviderModelCandidateId[];

const GLM_QUALITY_MODEL_CANDIDATES = [
  "glm-5-turbo",
  "glm-5.2",
  "glm-5.3"
] as const satisfies readonly GlmProviderModelCandidateId[];

const GLM_PROVIDER_MODEL_ORIGIN_PROFILES = [
  {
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    profileId: "coding_paas_v4",
    status: "prior_timeout_evidence",
    origin: GLM_RUNTIME_HEAVY_PLANNER_ORIGIN,
    endpoint: GLM_RUNTIME_HEAVY_PLANNER_ENDPOINT,
    defaultModelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    candidateModelIds: [GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID],
    runtimeDefaultEnabled: false,
    networkAccessApproved: false,
    credentialAccessApproved: false,
    healthDiagnosticApproved: false,
    heavyPlannerAcceptanceApproved: false
  },
  {
    providerId: GLM_RUNTIME_HEAVY_PLANNER_PROVIDER_ID,
    profileId: "standard_paas_v4",
    status: "candidate",
    origin: GLM_STANDARD_PAAS_V4_ORIGIN,
    endpoint: GLM_STANDARD_PAAS_V4_ENDPOINT,
    defaultModelId: GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    candidateModelIds: [
      GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
      ...GLM_LOW_LATENCY_MODEL_CANDIDATES,
      ...GLM_QUALITY_MODEL_CANDIDATES
    ],
    runtimeDefaultEnabled: false,
    networkAccessApproved: false,
    credentialAccessApproved: false,
    healthDiagnosticApproved: false,
    heavyPlannerAcceptanceApproved: false
  }
] as const satisfies readonly GlmProviderModelOriginProfile[];

export function listGlmProviderModelOriginProfiles(): readonly GlmProviderModelOriginProfile[] {
  return GLM_PROVIDER_MODEL_ORIGIN_PROFILES.map(cloneProfile);
}

export function getGlmProviderModelOriginProfile(
  profileId: GlmProviderOriginProfileId
): GlmProviderModelOriginProfile {
  const profile = GLM_PROVIDER_MODEL_ORIGIN_PROFILES.find(
    (candidate) => candidate.profileId === profileId
  );
  if (!profile) {
    throw new Error("GLM_PROVIDER_MODEL_ORIGIN_PROFILE_UNSUPPORTED");
  }
  return cloneProfile(profile);
}

export function isGlmProviderModelCandidateId(
  value: string
): value is GlmProviderModelCandidateId {
  return new Set<string>([
    GLM_RUNTIME_HEAVY_PLANNER_MODEL_ID,
    ...GLM_LOW_LATENCY_MODEL_CANDIDATES,
    ...GLM_QUALITY_MODEL_CANDIDATES
  ]).has(value);
}

function cloneProfile(
  profile: GlmProviderModelOriginProfile
): GlmProviderModelOriginProfile {
  return {
    ...profile,
    candidateModelIds: [...profile.candidateModelIds]
  };
}
