import {
  BrainIntent,
  BrainPlannerResult,
  BrainPlannerResultSchema,
  BrainRouterSelectionReport,
} from "@jarvis-k/contracts";

export const DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID =
  "planner.deterministic.rules";

export interface DeterministicPlannerOptions {
  enabled?: boolean;
  escalateIntents?: readonly BrainIntent[];
}

export interface DeterministicPlannerRoutingInput {
  decision: {
    intent: BrainIntent;
  };
  selection: Pick<BrainRouterSelectionReport, "reasonCode">;
}

export interface DeterministicPlannerServiceOptions {
  allowedToolIds: readonly string[];
  now: () => Date;
  extractOpenTarget: (text: string) => string | undefined;
  isKnownLocalAppTarget: (target: string) => boolean;
}

export interface DeterministicPlannerRequest {
  text: string;
  source: "text" | "voice";
  routing: DeterministicPlannerRoutingInput;
}

type MinimalPlannerStep = NonNullable<BrainPlannerResult["plan"]>["steps"][number];

const CONFIDENCE_FALLBACK_REASON_CODES = new Set([
  "CONFIDENCE_LOW",
  "INTENT_UNSUPPORTED",
  "CANDIDATE_MISSING",
  "RESULT_INVALID",
]);

const STATUS_PATTERN =
  /(?:status|health|diagnostic|\u72b6\u6001|\u8bca\u65ad|\u8fd0\u884c|\u68c0\u67e5)/iu;
const MEMORY_PATTERN =
  /(?:memory|remember|alias|preference|\u8bb0\u5fc6|\u504f\u597d|\u522b\u540d)/iu;
const FILE_PATTERN =
  /(?:search|find|file|document|\u6587\u4ef6|\u641c\u7d22|\u67e5\u627e|\u8d44\u6599)/iu;
const BROWSER_PATTERN =
  /(?:browser|url|website|web|github|izytoken|\u7f51\u9875|\u7f51\u5740|\u540e\u53f0)/iu;
const LOCAL_APP_PATTERN =
  /(?:notepad|calculator|vscode|vs code|visual studio code|app|\u8bb0\u4e8b\u672c|\u8ba1\u7b97\u5668|\u4ee3\u7801|\u5e94\u7528)/iu;
const PLUGIN_PATTERN =
  /(?:plugin|stock|quote|compare|bargain|\u63d2\u4ef6|\u80a1\u7968|\u5546\u54c1|\u6bd4\u8f83|\u780d\u4ef7)/iu;
const COMPLEX_PATTERN =
  /(?:plan|research|compare|workflow|multi-step|steps|\u5b89\u6392|\u8ba1\u5212|\u6bd4\u8f83|\u7814\u7a76|\u6b65\u9aa4|\u5148.+\u518d)/iu;

export class DeterministicPlannerService {
  private readonly allowedToolIds: Set<string>;

  public constructor(private readonly options: DeterministicPlannerServiceOptions) {
    this.allowedToolIds = new Set(options.allowedToolIds);
  }

  public shouldPlan(input: {
    options: DeterministicPlannerOptions | undefined;
    text: string;
    routing: DeterministicPlannerRoutingInput;
  }): boolean {
    if (input.options?.enabled !== true) {
      return false;
    }
    const escalatedIntents =
      input.options.escalateIntents ?? (["chat.answer", "clarify"] as const);
    if (escalatedIntents.includes(input.routing.decision.intent)) {
      return true;
    }
    if (CONFIDENCE_FALLBACK_REASON_CODES.has(input.routing.selection.reasonCode)) {
      return true;
    }
    return this.looksLikeComplexRequest(input.text);
  }

  public createResult(input: DeterministicPlannerRequest): BrainPlannerResult {
    const plannedAt = this.options.now().toISOString();
    const steps = this.createSteps(input.text);
    if (steps.length === 0) {
      return BrainPlannerResultSchema.parse({
        providerId: DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID,
        status: "clarify",
        reasonCode: "CLARIFY_REQUIRED",
        failureClass: "CLARIFY_REQUIRED",
        clarifyQuestion:
          "Please add the goal, target app or file, and the desired outcome.",
        directActionAttempted: false,
        plannedAt,
      });
    }
    return BrainPlannerResultSchema.parse({
      providerId: DETERMINISTIC_MINIMAL_PLANNER_PROVIDER_ID,
      status: "planned",
      reasonCode:
        input.routing.selection.reasonCode === "CONFIDENCE_LOW"
          ? "FAST_ROUTER_LOW_CONFIDENCE"
          : "COMPLEX_REQUEST",
      failureClass: "none",
      plan: {
        summary:
          "Deterministic minimal planner prepared a bounded draft plan for user review.",
        risk: "medium",
        requiresConfirmation: true,
        steps,
        directActionAttempted: false,
      },
      directActionAttempted: false,
      plannedAt,
    });
  }

  private createSteps(text: string): MinimalPlannerStep[] {
    const normalized = text.trim().toLowerCase();
    const steps: MinimalPlannerStep[] = [];
    const addStep = (input: {
      id: string;
      toolId: string;
      title: string;
      args?: Record<string, unknown>;
    }): void => {
      if (
        !this.allowedToolIds.has(input.toolId) ||
        steps.some((step) => step.id === input.id || step.toolId === input.toolId)
      ) {
        return;
      }
      steps.push({
        id: input.id,
        toolId: input.toolId,
        title: input.title,
        args: input.args ?? {},
        risk: "medium",
        requiresConfirmation: true,
        directActionAttempted: false,
      });
    };

    if (STATUS_PATTERN.test(normalized)) {
      addStep({
        id: "status-review",
        toolId: "observability.status",
        title: "Review current Jarvis-K runtime status",
      });
    }
    if (MEMORY_PATTERN.test(normalized)) {
      addStep({
        id: "memory-review",
        toolId: "memory.status",
        title: "Review user-controlled memory boundaries",
      });
    }
    if (FILE_PATTERN.test(normalized)) {
      addStep({
        id: "file-search",
        toolId: "filesystem.search",
        title: "Search bounded user file locations",
        args: {
          query: this.extractFilesystemQuery(text),
        },
      });
    }
    if (BROWSER_PATTERN.test(normalized)) {
      addStep({
        id: "browser-review",
        toolId: "browser.open",
        title: "Open a verified HTTPS browser target after policy checks",
        args: {
          target: this.extractBrowserTarget(text),
        },
      });
    }
    if (LOCAL_APP_PATTERN.test(normalized)) {
      addStep({
        id: "known-app",
        toolId: "localApp.open",
        title: "Open a known local app through Task Runtime",
        args: {
          target: this.extractLocalAppTarget(text),
        },
      });
    }
    if (PLUGIN_PATTERN.test(normalized)) {
      addStep({
        id: "plugin-readonly",
        toolId: "plugin.invoke",
        title: "Invoke a read-only plugin capability after permission gates",
      });
    }
    if (steps.length === 0 && this.looksLikeComplexRequest(text)) {
      addStep({
        id: "answer-plan",
        toolId: "chat.answer",
        title: "Draft the next safe user-visible plan",
      });
    }
    return steps.slice(0, 6);
  }

  private extractFilesystemQuery(text: string): string {
    const normalized = text.trim().toLowerCase();
    if (/\bproject\b|\u9879\u76ee/u.test(normalized)) {
      return "project";
    }
    if (/\bmemory\b|\u8bb0\u5fc6/u.test(normalized)) {
      return "memory";
    }
    const quoted = /["'\u201c\u201d\u2018\u2019]([^"'\u201c\u201d\u2018\u2019]{1,80})["'\u201c\u201d\u2018\u2019]/u.exec(
      text,
    );
    if (quoted?.[1]) {
      return quoted[1].trim();
    }
    return "project";
  }

  private extractBrowserTarget(text: string): string {
    const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/iu);
    if (urlMatch?.[0]) {
      return urlMatch[0];
    }
    const openTarget = this.options.extractOpenTarget(text);
    if (openTarget) {
      return openTarget;
    }
    const normalized = text.toLowerCase();
    if (normalized.includes("github")) {
      return "GitHub";
    }
    if (
      normalized.includes("izytoken") ||
      normalized.includes("easy token") ||
      normalized.includes("easytoken")
    ) {
      return "IZYtoken admin";
    }
    return "";
  }

  private extractLocalAppTarget(text: string): string {
    const openTarget = this.options.extractOpenTarget(text);
    if (openTarget && this.options.isKnownLocalAppTarget(openTarget)) {
      return openTarget;
    }
    const normalized = text.toLowerCase();
    if (
      normalized.includes("vscode") ||
      normalized.includes("vs code") ||
      normalized.includes("visual studio code")
    ) {
      return "vscode";
    }
    if (normalized.includes("notepad") || text.includes("\u8bb0\u4e8b\u672c")) {
      return "notepad";
    }
    if (
      normalized.includes("calculator") ||
      normalized.includes("calc") ||
      text.includes("\u8ba1\u7b97\u5668")
    ) {
      return "calculator";
    }
    return "";
  }

  private looksLikeComplexRequest(text: string): boolean {
    return COMPLEX_PATTERN.test(text.trim().toLowerCase());
  }
}
