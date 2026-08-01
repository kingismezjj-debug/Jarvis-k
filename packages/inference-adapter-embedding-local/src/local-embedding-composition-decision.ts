import type { LocalEmbeddingReadinessReport } from "./local-embedding-readiness-provider";

export interface LocalEmbeddingCompositionInput {
  readiness?: LocalEmbeddingReadinessReport;
  runtimeRegistered?: boolean;
  executionProviderComposed?: boolean;
  explicitEnablementApproved?: boolean;
}

export interface LocalEmbeddingCompositionDecision {
  readiness: LocalEmbeddingReadinessReport;
  canComposeProvider: boolean;
  canExecute: boolean;
  reasons: string[];
}

export function decideLocalEmbeddingComposition(
  input: LocalEmbeddingCompositionInput = {}
): LocalEmbeddingCompositionDecision {
  const readiness = input.readiness ?? {
    readyForComposition: false,
    checks: [],
    reasons: ["Local embedding readiness is not approved."]
  };
  const reasons = [...readiness.reasons];

  if (!input.runtimeRegistered) {
    reasons.push("Local embedding runtime is not registered.");
  }
  if (!input.executionProviderComposed) {
    reasons.push("Local embedding execution provider is not composed.");
  }
  if (!input.explicitEnablementApproved) {
    reasons.push("Local embedding execution enablement is not approved.");
  }

  const canComposeProvider =
    readiness.readyForComposition &&
    input.runtimeRegistered === true &&
    input.executionProviderComposed === true;
  return {
    readiness,
    canComposeProvider,
    canExecute:
      canComposeProvider && input.explicitEnablementApproved === true,
    reasons
  };
}
