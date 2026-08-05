import type { CoreMemoryRecallFailureClass } from "@jarvis-k/core";
import {
  runMemoryProviderVectorDeveloperAlphaContinuousUsage,
  type MemoryProviderVectorDeveloperAlphaContinuousReport,
  type MemoryProviderVectorDeveloperAlphaContinuousRunInput
} from "./memory-provider-vector-retrieval-developer-alpha-continuous-usage";

export const MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_MAX_TESTERS = 3;
export const MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_MAX_MESSAGES_PER_TESTER = 5;
export const MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_WINDOW_HOURS = 2;

export type MemoryProviderVectorBoundedTesterExpansionExecutionStatus =
  | "blocked"
  | "degraded"
  | "passed";

export type MemoryProviderVectorBoundedTesterExpansionExecutionReasonCode =
  | "execution_not_approved"
  | "phase836_preflight_missing"
  | "tester_scope_invalid"
  | "tester_messages_invalid"
  | "tester_session_degraded"
  | "tester_session_blocked"
  | "tester_session_not_accepted"
  | "unsafe_side_effect_requested";

export interface MemoryProviderVectorBoundedTesterExpansionTesterInput {
  testerId: string;
  messageTexts: readonly string[];
}

export interface MemoryProviderVectorBoundedTesterExpansionExecutionInput {
  env?: Readonly<Record<string, string | undefined>>;
  productApprovalGranted?: boolean;
  securityApprovalGranted?: boolean;
  releaseApprovalGranted?: boolean;
  phase836PreflightComplete?: boolean;
  testers?: readonly MemoryProviderVectorBoundedTesterExpansionTesterInput[];
  runTesterSession?: (
    input: MemoryProviderVectorDeveloperAlphaContinuousRunInput
  ) => Promise<MemoryProviderVectorDeveloperAlphaContinuousReport>;
  rawVectorsExposed?: boolean;
  rawTextExposed?: boolean;
  rawDiagnosticsExposed?: boolean;
  privatePathExposed?: boolean;
  signedUrlOrCredentialPersisted?: boolean;
  downloadsEnabled?: boolean;
  persistentCacheWritesEnabled?: boolean;
  historicalBatchIndexingEnabled?: boolean;
  sqliteSchemaMigrationEnabled?: boolean;
  desktopIpcChanged?: boolean;
  uiBehaviorChanged?: boolean;
  providerVisibilityChanged?: boolean;
  defaultOptInChanged?: boolean;
  modelOutputShellExecutionEnabled?: boolean;
  releaseChannelChanged?: boolean;
  installerPolicyChanged?: boolean;
  updateRollbackPolicyChanged?: boolean;
  modelLifecyclePolicyChanged?: boolean;
  cachePolicyChanged?: boolean;
  productSloDeclared?: boolean;
}

export interface MemoryProviderVectorBoundedTesterExpansionTesterReport {
  testerOrdinal: number;
  status: MemoryProviderVectorBoundedTesterExpansionExecutionStatus;
  messageCount: number;
  acceptedMessageCount: number;
  observationCount: number;
  recallStatus: "unknown" | "ok" | "degraded";
  recallMode: "unknown" | "provider_vector";
  recallFailureClasses: CoreMemoryRecallFailureClass[];
  recallMatchCount: number;
  queryDimensionCount: number;
  providerVectorWriteCount: number;
  providerVectorDimensionCount: number;
  rollbackDeletedCount: number;
  rollbackStatus: "not_started" | "passed" | "degraded";
  cleanupStatus: "not_started" | "passed" | "degraded";
  reasonCodes: readonly MemoryProviderVectorBoundedTesterExpansionExecutionReasonCode[];
}

export interface MemoryProviderVectorBoundedTesterExpansionExecutionReport {
  phase: "8.37";
  mode: "provider_vector_retrieval_bounded_tester_expansion_execution_run";
  status: MemoryProviderVectorBoundedTesterExpansionExecutionStatus;
  accepted: boolean;
  testerLimit: 3;
  messageLimitPerTester: 5;
  windowHours: 2;
  testerCount: number;
  acceptedTesterCount: number;
  messageCount: number;
  acceptedMessageCount: number;
  observationCount: number;
  providerVectorWriteCount: number;
  providerVectorDimensionCount: number;
  recallStatus: "unknown" | "ok" | "degraded";
  recallMode: "unknown" | "provider_vector";
  recallFailureClasses: CoreMemoryRecallFailureClass[];
  recallMatchCount: number;
  queryDimensionCount: number;
  rollbackStatus: "not_started" | "passed" | "degraded";
  rollbackDeletedCount: number;
  cleanupStatus: "not_started" | "passed" | "degraded";
  testerReports: readonly MemoryProviderVectorBoundedTesterExpansionTesterReport[];
  rawVectorsExposed: false;
  rawTextExposed: false;
  rawDiagnosticsExposed: false;
  privatePathExposed: false;
  signedUrlOrCredentialPersisted: false;
  downloadsEnabled: false;
  persistentCacheWritesEnabled: false;
  historicalBatchIndexingEnabled: false;
  sqliteSchemaMigrationEnabled: false;
  desktopIpcChanged: false;
  uiBehaviorChanged: false;
  providerVisibilityChanged: false;
  defaultOptInChanged: false;
  modelOutputShellExecutionEnabled: false;
  releaseChannelChanged: false;
  installerPolicyChanged: false;
  updateRollbackPolicyChanged: false;
  modelLifecyclePolicyChanged: false;
  cachePolicyChanged: false;
  productSloDeclared: false;
  reasonCodes: MemoryProviderVectorBoundedTesterExpansionExecutionReasonCode[];
}

export async function runMemoryProviderVectorBoundedTesterExpansionExecution(
  input: MemoryProviderVectorBoundedTesterExpansionExecutionInput = {}
): Promise<MemoryProviderVectorBoundedTesterExpansionExecutionReport> {
  const report = createInitialReport();

  const approvalReason = findApprovalFailure(input);
  if (approvalReason !== undefined) {
    report.status = "blocked";
    report.reasonCodes.push(approvalReason);
    return report;
  }

  if (hasUnsafeSideEffect(input)) {
    report.status = "blocked";
    report.reasonCodes.push("unsafe_side_effect_requested");
    return report;
  }

  const testers = sanitizeTesters(input.testers);
  if (testers.length < 1) {
    report.status = "degraded";
    report.reasonCodes.push("tester_scope_invalid");
    return report;
  }

  const runTesterSession =
    input.runTesterSession ??
    runMemoryProviderVectorDeveloperAlphaContinuousUsage;
  const testerReports: MemoryProviderVectorBoundedTesterExpansionTesterReport[] = [];

  for (const [index, tester] of testers.entries()) {
    const session = await runTesterSession({
      env: input.env ?? process.env,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      releaseApprovalGranted: true,
      phase830PreflightComplete: true,
      maxMessages:
        MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_MAX_MESSAGES_PER_TESTER,
      messageTexts: tester.messageTexts
    });
    const testerReport = createTesterReport(index + 1, session);
    testerReports.push(testerReport);
    addTesterReport(report, testerReport);
    if (testerReport.status !== "passed") {
      break;
    }
  }

  report.testerReports = testerReports;
  report.testerCount = testerReports.length;
  report.acceptedTesterCount = testerReports.filter(
    (tester) => tester.status === "passed"
  ).length;
  report.reasonCodes = [
    ...new Set(testerReports.flatMap((tester) => tester.reasonCodes))
  ];
  report.cleanupStatus =
    testerReports.every((tester) => tester.cleanupStatus === "passed")
      ? "passed"
      : "degraded";
  report.rollbackStatus =
    testerReports.every((tester) => tester.rollbackStatus === "passed")
      ? "passed"
      : "degraded";
  if (testerReports.every((tester) => tester.status === "passed")) {
    report.status = "passed";
    report.accepted = true;
    return report;
  }

  report.status = testerReports.some((tester) => tester.status === "blocked")
    ? "blocked"
    : "degraded";
  report.accepted = false;
  if (report.reasonCodes.length === 0) {
    report.reasonCodes.push("tester_session_not_accepted");
  }
  return report;
}

function createTesterReport(
  testerOrdinal: number,
  session: MemoryProviderVectorDeveloperAlphaContinuousReport
): MemoryProviderVectorBoundedTesterExpansionTesterReport {
  return {
    testerOrdinal,
    status: mapSessionStatus(session),
    messageCount: session.messageCount,
    acceptedMessageCount: session.acceptedMessageCount,
    observationCount: session.observationCount,
    recallStatus: session.recallStatus,
    recallMode: session.recallMode,
    recallFailureClasses: [...session.recallFailureClasses],
    recallMatchCount: session.recallMatchCount,
    queryDimensionCount: session.queryDimensionCount,
    providerVectorWriteCount: session.providerVectorWriteCount,
    providerVectorDimensionCount: session.providerVectorDimensionCount,
    rollbackDeletedCount: session.rollbackDeletedCount,
    rollbackStatus: session.rollbackStatus,
    cleanupStatus: session.cleanupStatus,
    reasonCodes: mapSessionReasonCodes(session)
  };
}

function mapSessionStatus(
  session: MemoryProviderVectorDeveloperAlphaContinuousReport
): MemoryProviderVectorBoundedTesterExpansionExecutionStatus {
  if (session.status === "blocked") {
    return "blocked";
  }
  return session.status === "passed" ? "passed" : "degraded";
}

function mapSessionReasonCodes(
  session: MemoryProviderVectorDeveloperAlphaContinuousReport
): MemoryProviderVectorBoundedTesterExpansionExecutionReasonCode[] {
  if (session.status === "passed" && session.accepted) {
    return [];
  }
  if (session.status === "blocked") {
    return ["tester_session_blocked"];
  }
  if (session.reasonCodes.includes("usage_messages_invalid")) {
    return ["tester_messages_invalid"];
  }
  return session.reasonCodes.length > 0
    ? ["tester_session_degraded"]
    : ["tester_session_not_accepted"];
}

function addTesterReport(
  report: MemoryProviderVectorBoundedTesterExpansionExecutionReport,
  tester: MemoryProviderVectorBoundedTesterExpansionTesterReport
): void {
  report.messageCount += tester.messageCount;
  report.acceptedMessageCount += tester.acceptedMessageCount;
  report.observationCount += tester.observationCount;
  report.providerVectorWriteCount += tester.providerVectorWriteCount;
  report.providerVectorDimensionCount = Math.max(
    report.providerVectorDimensionCount,
    tester.providerVectorDimensionCount
  );
  report.recallMatchCount = Math.max(
    report.recallMatchCount,
    tester.recallMatchCount
  );
  report.queryDimensionCount = Math.max(
    report.queryDimensionCount,
    tester.queryDimensionCount
  );
  report.rollbackDeletedCount += tester.rollbackDeletedCount;
  if (tester.recallMode === "provider_vector") {
    report.recallMode = "provider_vector";
  }
  for (const failureClass of tester.recallFailureClasses) {
    if (!report.recallFailureClasses.includes(failureClass)) {
      report.recallFailureClasses.push(failureClass);
    }
  }
  if (tester.recallStatus === "degraded") {
    report.recallStatus = "degraded";
  } else if (report.recallStatus === "unknown") {
    report.recallStatus = "ok";
  }
}

function sanitizeTesters(
  testers: readonly MemoryProviderVectorBoundedTesterExpansionTesterInput[] | undefined
): MemoryProviderVectorBoundedTesterExpansionTesterInput[] {
  if (
    !Array.isArray(testers) ||
    testers.length < 1 ||
    testers.length >
      MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_MAX_TESTERS
  ) {
    return [];
  }

  const sanitized = testers.map((tester, index) => {
    const messageTexts = sanitizeMessages(tester.messageTexts);
    const testerId =
      typeof tester.testerId === "string" && tester.testerId.trim().length > 0
        ? `tester-${index + 1}`
        : "";
    return {
      testerId,
      messageTexts
    };
  });
  return sanitized.every(
    (tester) => tester.testerId.length > 0 && tester.messageTexts.length > 0
  )
    ? sanitized
    : [];
}

function sanitizeMessages(messages: readonly string[] | undefined): string[] {
  if (
    !Array.isArray(messages) ||
    messages.length < 1 ||
    messages.length >
      MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_MAX_MESSAGES_PER_TESTER
  ) {
    return [];
  }
  const sanitized = messages.map((message) =>
    typeof message === "string"
      ? message
          .replace(/[\u0000-\u001f\u007f]/gu, " ")
          .replace(/\s+/gu, " ")
          .trim()
          .slice(0, 500)
          .trim()
      : ""
  );
  return sanitized.every((message) => message.length > 0) ? sanitized : [];
}

function findApprovalFailure(
  input: MemoryProviderVectorBoundedTesterExpansionExecutionInput
): MemoryProviderVectorBoundedTesterExpansionExecutionReasonCode | undefined {
  if (
    input.productApprovalGranted !== true ||
    input.securityApprovalGranted !== true ||
    input.releaseApprovalGranted !== true
  ) {
    return "execution_not_approved";
  }
  if (input.phase836PreflightComplete !== true) {
    return "phase836_preflight_missing";
  }
  return undefined;
}

function hasUnsafeSideEffect(
  input: MemoryProviderVectorBoundedTesterExpansionExecutionInput
): boolean {
  return (
    input.rawVectorsExposed === true ||
    input.rawTextExposed === true ||
    input.rawDiagnosticsExposed === true ||
    input.privatePathExposed === true ||
    input.signedUrlOrCredentialPersisted === true ||
    input.downloadsEnabled === true ||
    input.persistentCacheWritesEnabled === true ||
    input.historicalBatchIndexingEnabled === true ||
    input.sqliteSchemaMigrationEnabled === true ||
    input.desktopIpcChanged === true ||
    input.uiBehaviorChanged === true ||
    input.providerVisibilityChanged === true ||
    input.defaultOptInChanged === true ||
    input.modelOutputShellExecutionEnabled === true ||
    input.releaseChannelChanged === true ||
    input.installerPolicyChanged === true ||
    input.updateRollbackPolicyChanged === true ||
    input.modelLifecyclePolicyChanged === true ||
    input.cachePolicyChanged === true ||
    input.productSloDeclared === true
  );
}

function createInitialReport(): MemoryProviderVectorBoundedTesterExpansionExecutionReport {
  return {
    phase: "8.37",
    mode: "provider_vector_retrieval_bounded_tester_expansion_execution_run",
    status: "degraded",
    accepted: false,
    testerLimit: MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_MAX_TESTERS,
    messageLimitPerTester:
      MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_MAX_MESSAGES_PER_TESTER,
    windowHours: MEMORY_PROVIDER_VECTOR_BOUNDED_TESTER_EXPANSION_WINDOW_HOURS,
    testerCount: 0,
    acceptedTesterCount: 0,
    messageCount: 0,
    acceptedMessageCount: 0,
    observationCount: 0,
    providerVectorWriteCount: 0,
    providerVectorDimensionCount: 0,
    recallStatus: "unknown",
    recallMode: "unknown",
    recallFailureClasses: [],
    recallMatchCount: 0,
    queryDimensionCount: 0,
    rollbackStatus: "not_started",
    rollbackDeletedCount: 0,
    cleanupStatus: "not_started",
    testerReports: [],
    rawVectorsExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathExposed: false,
    signedUrlOrCredentialPersisted: false,
    downloadsEnabled: false,
    persistentCacheWritesEnabled: false,
    historicalBatchIndexingEnabled: false,
    sqliteSchemaMigrationEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    modelOutputShellExecutionEnabled: false,
    releaseChannelChanged: false,
    installerPolicyChanged: false,
    updateRollbackPolicyChanged: false,
    modelLifecyclePolicyChanged: false,
    cachePolicyChanged: false,
    productSloDeclared: false,
    reasonCodes: []
  };
}
