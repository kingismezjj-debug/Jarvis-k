import { describe, expect, it } from "vitest";
import { CoreHostQwenFastRouterGenerationPort } from "../src/qwen-fast-router-generation-port";

describe("Core Host Qwen fast-router generation port", () => {
  it("maps Qwen router generation input to the bounded runtime helper request", async () => {
    const calls: unknown[] = [];
    const port = new CoreHostQwenFastRouterGenerationPort({
      sessionId: "session-qwen-1",
      resourceLeaseId: "lease-qwen-1",
      helper: {
        async generate(input) {
          calls.push(input);
          return {
            modelId: input.modelId,
            text: "{\"intent\":\"chat\",\"confidence\":0.8,\"slots\":{}}",
            generatedAt: "2026-08-06T00:00:00.000Z"
          };
        }
      }
    });

    await expect(
      port.generate({
        modelId: "Qwen/Qwen3-0.6B",
        prompt: "Route command.",
        maxOutputChars: 512,
        temperature: 0
      })
    ).resolves.toBe(
      "{\"intent\":\"chat\",\"confidence\":0.8,\"slots\":{}}"
    );
    expect(calls).toEqual([
      {
        sessionId: "session-qwen-1",
        resourceLeaseId: "lease-qwen-1",
        modelId: "Qwen/Qwen3-0.6B",
        prompt: "Route command.",
        maxOutputChars: 512,
        temperature: 0
      }
    ]);
  });

  it("fails closed when helper generation is disabled", async () => {
    const port = new CoreHostQwenFastRouterGenerationPort({
      sessionId: "session-qwen-1",
      resourceLeaseId: "lease-qwen-1",
      helper: {
        async generate() {
          throw Object.assign(
            new Error(
              "Generation execution remains disabled by the runtime gate."
            ),
            { code: "GENERATION_EXECUTION_DISABLED" }
          );
        }
      }
    });

    await expect(
      port.generate({
        modelId: "Qwen/Qwen3-0.6B",
        prompt: "Route command.",
        maxOutputChars: 512,
        temperature: 0
      })
    ).rejects.toMatchObject({
      code: "GENERATION_EXECUTION_DISABLED"
    });
  });

  it("rejects mismatched or oversized helper generation output", async () => {
    const port = new CoreHostQwenFastRouterGenerationPort({
      sessionId: "session-qwen-1",
      resourceLeaseId: "lease-qwen-1",
      helper: {
        async generate() {
          return {
            modelId: "unexpected/model",
            text: "{\"intent\":\"chat\",\"confidence\":0.8,\"slots\":{}}",
            generatedAt: "2026-08-06T00:00:00.000Z"
          };
        }
      }
    });

    await expect(
      port.generate({
        modelId: "Qwen/Qwen3-0.6B",
        prompt: "Route command.",
        maxOutputChars: 512,
        temperature: 0
      })
    ).rejects.toThrow("GENERATION_OUTPUT_INVALID");
  });
});
