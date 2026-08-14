import type {
  QwenFastRouterGenerationInput,
  QwenFastRouterGenerationPort
} from "@jarvis-k/inference-adapter-qwen-router";
import type {
  RuntimeHelperClient,
  RuntimeHelperGenerateResponse
} from "@jarvis-k/inference-runtime-transformers-local";

export interface CoreHostQwenFastRouterGenerationPortOptions {
  helper: Pick<RuntimeHelperClient, "generate">;
  sessionId: string;
  resourceLeaseId: string;
}

export class CoreHostQwenFastRouterGenerationPort
  implements QwenFastRouterGenerationPort
{
  public constructor(
    private readonly options: CoreHostQwenFastRouterGenerationPortOptions
  ) {}

  public async generate(
    input: QwenFastRouterGenerationInput
  ): Promise<string> {
    const payload = await this.options.helper.generate({
      sessionId: this.options.sessionId,
      resourceLeaseId: this.options.resourceLeaseId,
      modelId: input.modelId,
      prompt: input.prompt,
      maxOutputChars: input.maxOutputChars,
      temperature: input.temperature
    });

    return parseGenerationPayload(payload, input);
  }
}

function parseGenerationPayload(
  payload: RuntimeHelperGenerateResponse["payload"],
  input: QwenFastRouterGenerationInput
): string {
  if (
    payload.modelId !== input.modelId ||
    payload.text.length > input.maxOutputChars
  ) {
    throw new Error("GENERATION_OUTPUT_INVALID");
  }
  return payload.text;
}
