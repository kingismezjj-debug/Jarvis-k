import { describe, expect, it } from "vitest";
import {
  FixtureAdvancedReasoningProvider,
  createFixtureAdvancedBrainProfile,
} from "../src";
import { requestFixture } from "./helpers/advanced-brain-fixtures";

describe("FixtureAdvancedReasoningProvider", () => {
  it("returns deterministic fixture answers without network or credentials", async () => {
    const provider = new FixtureAdvancedReasoningProvider({
      now: () => new Date("2026-08-25T00:00:00.000Z"),
    });
    const prepared = await provider.prepare(requestFixture());
    const result = await provider.execute(prepared);

    expect(result.resultClass).toBe("answer");
    expect(result.executionSemantics).toBe("fixture");
    expect(result.networkRequestIssued).toBe(false);
    expect(result.credentialExposed).toBe(false);
    expect(result.directActionAttempted).toBe(false);
  });

  it("returns approval-bound structured plans", async () => {
    const provider = new FixtureAdvancedReasoningProvider({
      behavior: "plan",
      now: () => new Date("2026-08-25T00:00:00.000Z"),
    });
    const prepared = await provider.prepare(
      requestFixture({
        category: "multi_step_plan",
        requestedOutput: "structured_plan",
        allowedCapabilities: ["text_reasoning", "structured_output"],
      }),
    );
    const result = await provider.execute(prepared);

    expect(result.resultClass).toBe("structured_plan");
    expect(result.structuredPlan?.requiresConfirmation).toBe(true);
    expect(result.structuredPlan?.directActionAttempted).toBe(false);
  });

  it("keeps attempted tools as untrusted proposals instead of execution", async () => {
    const provider = new FixtureAdvancedReasoningProvider({
      behavior: "tool_attempt",
    });
    const prepared = await provider.prepare(
      requestFixture({
        category: "plugin_orchestration",
        requestedOutput: "structured_plan",
        allowedCapabilities: ["text_reasoning", "structured_output"],
      }),
    );
    const result = await provider.execute(prepared);

    expect(result.untrustedProposals).toEqual([
      {
        proposalType: "tool_call",
        proposalId: "fixture-tool-proposal",
        requiresPlannerApproval: true,
        directActionAttempted: false,
      },
    ]);
    expect(result.directActionAttempted).toBe(false);
  });

  it("normalizes clarify and unavailable fixture outcomes", async () => {
    const clarify = new FixtureAdvancedReasoningProvider({
      behavior: "clarification",
    });
    const unavailable = new FixtureAdvancedReasoningProvider({
      behavior: "unavailable",
    });

    expect(
      (await clarify.execute(await clarify.prepare(requestFixture()))).resultClass,
    ).toBe("clarification");
    expect(
      (
        await unavailable.execute(await unavailable.prepare(requestFixture()))
      ).resultClass,
    ).toBe("unavailable");
  });

  it("creates a stable fixture profile with fixture privacy semantics", () => {
    const profile = createFixtureAdvancedBrainProfile();

    expect(profile.providerId).toBe("advanced-brain.fixture");
    expect(profile.privacyClass).toBe("fixture");
    expect(profile.regionAvailability).toEqual(["local"]);
  });
});
