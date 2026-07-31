import type {
  EmbeddingGenerationRequest,
  EmbeddingGenerationResult
} from "@jarvis-k/contracts";
import type { EmbeddingInferenceProvider } from "./ports";

export class UnavailableEmbeddingProvider
  implements EmbeddingInferenceProvider
{
  public async embed(
    _request: EmbeddingGenerationRequest
  ): Promise<EmbeddingGenerationResult> {
    throw new Error(embeddingProviderUnavailableReason());
  }
}

export function embeddingProviderUnavailableReason(): string {
  return "Embedding provider is not configured.";
}
