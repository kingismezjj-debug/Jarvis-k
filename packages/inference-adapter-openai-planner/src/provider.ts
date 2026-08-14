import type { HeavyPlannerProvider } from "@jarvis-k/capabilities";
import {
  BrainPlannerRequestSchema,
  BrainPlannerResultSchema,
  type BrainPlannerRequest,
  type BrainPlannerResult
} from "@jarvis-k/contracts";

export const OPENAI_HEAVY_PLANNER_PROVIDER_ID = "heavy-planner.openai";

export interface OpenAiHeavyPlannerCredential {
  readonly apiKey: string;
}

export interface OpenAiHeavyPlannerTransportRequest {
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: Record<string, unknown>;
  readonly timeoutMs: number;
}

export interface OpenAiHeavyPlannerTransportResponse {
  readonly status: number;
  readonly body: unknown;
}

export interface OpenAiHeavyPlannerTransport {
  send(
    request: OpenAiHeavyPlannerTransportRequest
  ): Promise<OpenAiHeavyPlannerTransportResponse>;
}

export interface OpenAiHeavyPlannerProviderOptions {
  readonly credential: OpenAiHeavyPlannerCredential;
  readonly transport: OpenAiHeavyPlannerTransport;
  readonly model?: string;
  readonly endpoint?: string;
  readonly timeoutMs?: number;
  readonly now?: () => Date;
}

const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_ENDPOINT = "https://api.openai.com/v1/responses";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 700;
const ALLOWED_TOOL_IDS = new Set([
  "browser.open",
  "localApp.open",
  "chat.answer",
  "memory.search",
  "memory.status",
  "model.status",
  "observability.status",
  "system.settings"
]);
const SECRET_PATTERN =
  /(?:\bBearer\b|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret|sk-[A-Za-z0-9_-]{8,})/iu;

export class OpenAiHeavyPlannerProvider implements HeavyPlannerProvider {
  private readonly model: string;
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly now: () => Date;

  public constructor(
    private readonly options: OpenAiHeavyPlannerProviderOptions
  ) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.timeoutMs = Math.min(
      DEFAULT_TIMEOUT_MS,
      Math.max(1_000, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    );
    this.now = options.now ?? (() => new Date());
    if (!isCredentialUsable(options.credential)) {
      throw new Error("OPENAI_HEAVY_PLANNER_CREDENTIAL_INVALID");
    }
  }

  public async plan(
    request: BrainPlannerRequest
  ): Promise<BrainPlannerResult> {
    const parsedRequest = BrainPlannerRequestSchema.parse(request);
    const response = await this.options.transport.send({
      url: this.endpoint,
      timeoutMs: this.timeoutMs,
      headers: {
        Authorization: `Bearer ${this.options.credential.apiKey}`,
        "Content-Type": "application/json"
      },
      body: createResponsesApiBody(parsedRequest, this.model)
    });
    if (response.status === 401 || response.status === 403) {
      return unavailableResult("PROVIDER_UNAVAILABLE", this.now);
    }
    if (response.status === 408 || response.status === 429) {
      return unavailableResult("PROVIDER_UNAVAILABLE", this.now);
    }
    if (response.status < 200 || response.status >= 300) {
      return unavailableResult("PROVIDER_FAILED", this.now);
    }
    const outputText = extractOutputText(response.body);
    return parseOpenAiHeavyPlannerOutput(outputText, this.now);
  }
}

export class FetchOpenAiHeavyPlannerTransport
  implements OpenAiHeavyPlannerTransport
{
  public async send(
    request: OpenAiHeavyPlannerTransportRequest
  ): Promise<OpenAiHeavyPlannerTransportResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
    try {
      const response = await fetch(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: controller.signal
      });
      const text = await response.text();
      return {
        status: response.status,
        body: text.length > 0 ? JSON.parse(text) : {}
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function parseOpenAiHeavyPlannerOutput(
  output: string,
  now: () => Date = () => new Date()
): BrainPlannerResult {
  if (output.length > 20_000 || SECRET_PATTERN.test(output)) {
    throw new Error("OPENAI_HEAVY_PLANNER_OUTPUT_INVALID");
  }
  const raw = JSON.parse(output);
  const parsed = BrainPlannerResultSchema.parse(
    isRecord(raw)
      ? {
          ...raw,
          ...(raw.plan === null ? { plan: undefined } : {}),
          ...(raw.clarifyQuestion === null
            ? { clarifyQuestion: undefined }
            : {})
        }
      : raw
  );
  if (parsed.providerId !== OPENAI_HEAVY_PLANNER_PROVIDER_ID) {
    throw new Error("OPENAI_HEAVY_PLANNER_PROVIDER_MISMATCH");
  }
  if (parsed.directActionAttempted !== false) {
    throw new Error("OPENAI_HEAVY_PLANNER_DIRECT_ACTION_ATTEMPTED");
  }
  if (parsed.plan) {
    for (const step of parsed.plan.steps) {
      if (!ALLOWED_TOOL_IDS.has(step.toolId)) {
        throw new Error("OPENAI_HEAVY_PLANNER_TOOL_UNSUPPORTED");
      }
    }
  }
  return BrainPlannerResultSchema.parse({
    ...parsed,
    plannedAt: parsed.plannedAt || now().toISOString()
  });
}

function createResponsesApiBody(
  request: BrainPlannerRequest,
  model: string
): Record<string, unknown> {
  return {
    model,
    input: [
      {
        role: "system",
        content:
          "Return only bounded BrainPlannerResult JSON. Do not execute tools. Use directActionAttempted false."
      },
      {
        role: "user",
        content: JSON.stringify({
          providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
          utterance: request.utterance,
          source: request.source,
          routerDecision: request.routerDecision,
          allowedToolIds: request.context?.allowedToolIds ?? []
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "brain_planner_result",
        strict: true,
        schema: plannerJsonSchema()
      }
    },
    temperature: 0,
    max_output_tokens: MAX_OUTPUT_TOKENS
  };
}

function plannerJsonSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "providerId",
      "status",
      "reasonCode",
      "failureClass",
      "plan",
      "clarifyQuestion",
      "directActionAttempted",
      "plannedAt"
    ],
    properties: {
      providerId: { const: OPENAI_HEAVY_PLANNER_PROVIDER_ID },
      status: {
        enum: ["planned", "clarify", "blocked", "unavailable"]
      },
      reasonCode: { type: "string" },
      failureClass: { type: "string" },
      plan: {
        anyOf: [brainPlanJsonSchema(), { type: "null" }]
      },
      clarifyQuestion: {
        anyOf: [{ type: "string", maxLength: 500 }, { type: "null" }]
      },
      directActionAttempted: { const: false },
      plannedAt: { type: "string" }
    }
  };
}

function brainPlanJsonSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "risk",
      "requiresConfirmation",
      "steps",
      "directActionAttempted"
    ],
    properties: {
      summary: { type: "string", maxLength: 2_000 },
      risk: { enum: ["low", "medium", "high", "blocked"] },
      requiresConfirmation: { type: "boolean" },
      steps: {
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "toolId",
            "title",
            "args",
            "risk",
            "requiresConfirmation",
            "directActionAttempted"
          ],
          properties: {
            id: { type: "string", maxLength: 128 },
            toolId: { type: "string", maxLength: 128 },
            title: { type: "string", maxLength: 300 },
            args: { type: "object", additionalProperties: true },
            risk: { enum: ["low", "medium", "high", "blocked"] },
            requiresConfirmation: { type: "boolean" },
            directActionAttempted: { const: false }
          }
        }
      },
      directActionAttempted: { const: false }
    }
  };
}

function extractOutputText(body: unknown): string {
  if (typeof body === "string") {
    return body;
  }
  if (!isRecord(body)) {
    throw new Error("OPENAI_HEAVY_PLANNER_RESPONSE_INVALID");
  }
  if (typeof body.output_text === "string") {
    return body.output_text;
  }
  const output = Array.isArray(body.output) ? body.output : [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }
    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  throw new Error("OPENAI_HEAVY_PLANNER_RESPONSE_INVALID");
}

function unavailableResult(
  reasonCode: "PROVIDER_UNAVAILABLE" | "PROVIDER_FAILED",
  now: () => Date
): BrainPlannerResult {
  return BrainPlannerResultSchema.parse({
    providerId: OPENAI_HEAVY_PLANNER_PROVIDER_ID,
    status: "unavailable",
    reasonCode,
    failureClass:
      reasonCode === "PROVIDER_FAILED"
        ? "PROVIDER_EXECUTION_FAILED"
        : "PROVIDER_UNAVAILABLE",
    directActionAttempted: false,
    plannedAt: now().toISOString()
  });
}

function isCredentialUsable(
  credential: OpenAiHeavyPlannerCredential
): boolean {
  return (
    typeof credential.apiKey === "string" &&
    credential.apiKey.trim().length >= 8 &&
    credential.apiKey.length <= 512
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
