import type {
  IntentRoutingRequest,
  IntentRoutingResult
} from "@jarvis-k/contracts";
import type { IntentRoutingProvider } from "./ports";

export class UnavailableIntentRoutingProvider
  implements IntentRoutingProvider
{
  public async route(
    _request: IntentRoutingRequest
  ): Promise<IntentRoutingResult> {
    throw new Error(intentRoutingProviderUnavailableReason());
  }
}

export function intentRoutingProviderUnavailableReason(): string {
  return "Intent routing provider is not configured.";
}
