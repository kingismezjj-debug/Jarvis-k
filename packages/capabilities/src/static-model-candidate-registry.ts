import {
  ModelCandidateSchema,
  type LocalModelCapability,
  type ModelCandidate
} from "@jarvis-k/contracts";
import type {
  ModelCandidateRegistry,
  ModelCandidateRegistryListOptions
} from "./ports";

export class StaticModelCandidateRegistry implements ModelCandidateRegistry {
  private readonly candidates: ModelCandidate[];

  public constructor(candidates: ModelCandidate[]) {
    this.candidates = candidates.map((candidate) =>
      ModelCandidateSchema.parse(candidate)
    );
  }

  public async listCandidates(
    options: ModelCandidateRegistryListOptions = {}
  ): Promise<ModelCandidate[]> {
    return this.candidates
      .filter((candidate) =>
        matchesCapability(candidate, options.capability)
      )
      .filter((candidate) =>
        options.includeRedRisk ? true : candidate.licenseRisk !== "red"
      )
      .map((candidate) => cloneCandidate(candidate));
  }

  public async getCandidate(
    modelId: string
  ): Promise<ModelCandidate | undefined> {
    const candidate = this.candidates.find((item) => item.id === modelId);
    return candidate ? cloneCandidate(candidate) : undefined;
  }
}

function matchesCapability(
  candidate: ModelCandidate,
  capability: LocalModelCapability | undefined
): boolean {
  return capability === undefined || candidate.capability === capability;
}

function cloneCandidate(candidate: ModelCandidate): ModelCandidate {
  return ModelCandidateSchema.parse(candidate);
}
