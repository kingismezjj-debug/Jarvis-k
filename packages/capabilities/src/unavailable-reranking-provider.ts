import type {
  RerankRequest,
  RerankResult
} from "@jarvis-k/contracts";
import type { RerankingProvider } from "./ports";

export class UnavailableRerankingProvider implements RerankingProvider {
  public async rerank(_request: RerankRequest): Promise<RerankResult> {
    throw new Error(rerankingProviderUnavailableReason());
  }
}

export function rerankingProviderUnavailableReason(): string {
  return "Reranking provider is not configured.";
}
