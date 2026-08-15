import { describe, expect, it } from "vitest";
import {
  DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID,
  DeterministicPlannerService,
} from "../src/planner/deterministic-planner-service";

const allowedToolIds = [
  "browser.open",
  "localApp.open",
  "chat.answer",
  "filesystem.search",
  "plugin.invoke",
  "memory.status",
  "observability.status",
] as const;

function createService(
  overrides: Partial<ConstructorParameters<typeof DeterministicPlannerService>[0]> = {},
): DeterministicPlannerService {
  return new DeterministicPlannerService({
    allowedToolIds,
    now: () => new Date("2026-08-14T00:00:00.000Z"),
    extractOpenTarget: (text) => {
      const match = /\bopen\s+([a-z0-9 .:-]+)/iu.exec(text);
      return match?.[1]?.trim();
    },
    isKnownLocalAppTarget: (target) =>
      ["notepad", "calculator", "vscode"].includes(target.toLowerCase()),
    ...overrides,
  });
}

describe("DeterministicPlannerService", () => {
  it("leaves simple low-risk known app commands on the direct router path", () => {
    const service = createService();

    expect(
      service.shouldPlan({
        options: {
          enabled: true,
          escalateIntents: [],
        },
        text: "open notepad",
        routing: {
          decision: {
            intent: "localApp.open",
          },
          selection: {
            reasonCode: "RULE_MATCH",
          },
        },
      }),
    ).toBe(false);
  });

  it("creates bounded deterministic draft steps without direct execution", () => {
    const service = createService();

    const result = service.createResult({
      source: "text",
      text: "Plan a multi-step workflow to check memory status and search project files",
      routing: {
        decision: {
          intent: "chat.answer",
        },
        selection: {
          reasonCode: "RULE_MATCH",
        },
      },
    });

    expect(result).toMatchObject({
      providerId: DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID,
      status: "planned",
      reasonCode: "COMPLEX_REQUEST",
      failureClass: "none",
      directActionAttempted: false,
    });
    expect(result.plan?.requiresConfirmation).toBe(true);
    expect(result.plan?.directActionAttempted).toBe(false);
    expect(result.plan?.steps.map((step) => step.toolId)).toEqual([
      "observability.status",
      "memory.status",
      "filesystem.search",
    ]);
    expect(result.plan?.steps.every((step) => step.directActionAttempted)).toBe(
      false,
    );
  });

  it("fails closed to clarification when no safe deterministic step can be created", () => {
    const service = createService({
      allowedToolIds: ["chat.answer"],
    });

    const result = service.createResult({
      source: "text",
      text: "open browser",
      routing: {
        decision: {
          intent: "chat.answer",
        },
        selection: {
          reasonCode: "RULE_MATCH",
        },
      },
    });

    expect(result).toMatchObject({
      status: "clarify",
      reasonCode: "CLARIFY_REQUIRED",
      failureClass: "CLARIFY_REQUIRED",
      directActionAttempted: false,
    });
    expect(result.plan).toBeUndefined();
  });

  it("normalizes low-confidence deterministic drafts distinctly from complex drafts", () => {
    const service = createService();

    const result = service.createResult({
      source: "voice",
      text: "search project files",
      routing: {
        decision: {
          intent: "filesystem.search",
        },
        selection: {
          reasonCode: "CONFIDENCE_LOW",
        },
      },
    });

    expect(result).toMatchObject({
      status: "planned",
      reasonCode: "FAST_ROUTER_LOW_CONFIDENCE",
      failureClass: "none",
      directActionAttempted: false,
    });
    expect(result.plan?.steps).toHaveLength(1);
    expect(result.plan?.steps[0]).toMatchObject({
      toolId: "filesystem.search",
      args: {
        query: "project",
      },
      requiresConfirmation: true,
      directActionAttempted: false,
    });
  });

  it("does not emit tools outside the configured planner allowlist", () => {
    const service = createService({
      allowedToolIds: ["memory.status", "observability.status"],
    });

    const result = service.createResult({
      source: "text",
      text: "Plan steps to check memory status, open GitHub, search project files, and invoke a plugin",
      routing: {
        decision: {
          intent: "chat.answer",
        },
        selection: {
          reasonCode: "RULE_MATCH",
        },
      },
    });

    expect(result.status).toBe("planned");
    expect(result.plan?.steps.map((step) => step.toolId)).toEqual([
      "observability.status",
      "memory.status",
    ]);
  });
});
