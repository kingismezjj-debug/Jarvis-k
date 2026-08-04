import { describe, expect, it } from "vitest";
import {
  createMemoryProviderVectorTesterExpansionOperatorChecklist,
  evaluateMemoryProviderVectorTesterExpansionDryRunPreflight,
  type MemoryProviderVectorTesterExpansionDryRunPreflightInput
} from "../src/memory-provider-vector-retrieval-tester-expansion-dry-run-preflight";
import { MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV } from "../src/memory-provider-vector-retrieval-developer-alpha-plan";

describe("Memory provider-vector retrieval tester expansion dry-run preflight", () => {
  it("accepts complete operator checklist evidence without starting expansion", () => {
    const result = evaluateMemoryProviderVectorTesterExpansionDryRunPreflight(
      approvedInput()
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      phase: "8.35",
      capability:
        "memory_provider_vector_retrieval_tester_expansion_dry_run_preflight",
      status: "ready_for_bounded_tester_expansion_dry_run_review",
      accepted: true,
      readyForBoundedTesterExpansionDryRunReview: true,
      dryRunOnly: true,
      operatorChecklist: {
        mode: "bounded_tester_expansion_operator_checklist",
        scope: "dry_run_preflight_only",
        envKey: MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
        maximumTesterLimit: 3,
        maximumMessagesPerTester: 5,
        maximumWindowHours: 2,
        defaultEnabled: false,
        testerInvitationsAllowed: false,
        realUsageSessionAllowed: false,
        envReadsAllowed: false,
        artifactAccessAllowed: false,
        helperExecutionAllowed: false,
        providerVectorExecutionAllowed: false,
        uiControlsAllowed: false,
        sqliteMigrationAllowed: false,
        rawOutputAllowed: false,
        shellExecutionAllowed: false
      },
      testerExpansionExecuted: false,
      testerInvitationSent: false,
      realUsageSessionStarted: false,
      envRead: false,
      runtimePythonRead: false,
      modelArtifactPathRead: false,
      artifactAccessed: false,
      helperStarted: false,
      helperLoadCalled: false,
      helperEmbedCalled: false,
      providerExecutionCalled: false,
      providerVectorWriteExecuted: false,
      providerVectorReadExecuted: false,
      realMemoryVectorDataWritten: false,
      persistentModelCacheEnabled: false,
      sqliteSchemaMigrationEnabled: false,
      historicalBatchIndexingEnabled: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathExposed: false,
      signedUrlOrCredentialPersisted: false,
      modelOutputShellExecutionEnabled: false,
      releaseChannelChanged: false,
      installerPolicyChanged: false,
      updateRollbackPolicyChanged: false,
      modelLifecyclePolicyChanged: false,
      cachePolicyChanged: false,
      productSloDeclared: false,
      checkedAreas: [
        "phase_834_approval_packet",
        "operator_checklist",
        "env_gate_checklist",
        "rollback_dry_run_checklist",
        "sanitized_report_schema",
        "stop_condition_checklist",
        "release_gate_checklist",
        "candidate_tester_roster_policy",
        "consent_message_policy"
      ],
      reasonCodes: []
    });
    expect(result.prerequisiteEnvKeys).toEqual([
      MEMORY_PROVIDER_VECTOR_RETRIEVAL_DEVELOPER_ALPHA_ENV,
      "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING",
      "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR",
      "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES",
      "JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS",
      "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER",
      "JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION",
      "JARVIS_K_RUNTIME_PYTHON",
      "JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR"
    ]);
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
    expect(serialized).not.toMatch(
      /\b(api[_-]?key|signed[_-]?url|access[_-]?token|secret)\b/iu
    );
  });

  it("degrades when checklist, report, stop, or verification evidence is missing", () => {
    const result = evaluateMemoryProviderVectorTesterExpansionDryRunPreflight({
      ...approvedInput(),
      operatorChecklistReviewed: false,
      envGateChecklistReviewed: false,
      rollbackDryRunChecklistReviewed: false,
      sanitizedReportSchemaReviewed: false,
      stopConditionChecklistReviewed: false,
      releaseGateChecklistReviewed: false,
      verificationClean: false,
      ciVerificationClean: false
    });

    expect(result).toMatchObject({
      status: "degraded",
      accepted: false,
      dryRunOnly: true,
      checkedAreas: [],
      checks: {
        operatorChecklistReviewed: false,
        envGateChecklistReviewed: false,
        rollbackDryRunChecklistReviewed: false,
        sanitizedReportSchemaReviewed: false,
        stopConditionChecklistReviewed: false,
        releaseGateChecklistReviewed: false,
        verificationClean: false,
        ciVerificationClean: false,
        helperNotStarted: true,
        providerVectorWriteNotExecuted: true
      }
    });
    expect(result.reasonCodes).toEqual([
      "operator_checklist_missing",
      "env_gate_checklist_missing",
      "rollback_dry_run_checklist_missing",
      "sanitized_report_schema_missing",
      "stop_condition_checklist_missing",
      "release_gate_checklist_missing",
      "verification_clean_missing",
      "ci_verification_missing"
    ]);
  });

  it("blocks tester expansion, invitations, real usage, env reads, runtime access, helper execution, vector operations, and migrations", () => {
    const result = evaluateMemoryProviderVectorTesterExpansionDryRunPreflight({
      ...approvedInput(),
      testerExpansionExecuted: true,
      testerInvitationSent: true,
      realUsageSessionStarted: true,
      envRead: true,
      runtimePythonRead: true,
      modelArtifactPathRead: true,
      artifactAccessed: true,
      helperStarted: true,
      helperLoadCalled: true,
      helperEmbedCalled: true,
      providerExecutionCalled: true,
      providerVectorWriteExecuted: true,
      providerVectorReadExecuted: true,
      realMemoryVectorDataWritten: true,
      persistentModelCacheEnabled: true,
      sqliteSchemaMigrationEnabled: true,
      historicalBatchIndexingEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      testerExpansionExecuted: false,
      testerInvitationSent: false,
      realUsageSessionStarted: false,
      envRead: false,
      runtimePythonRead: false,
      modelArtifactPathRead: false,
      artifactAccessed: false,
      helperStarted: false,
      helperLoadCalled: false,
      helperEmbedCalled: false,
      providerExecutionCalled: false,
      providerVectorWriteExecuted: false,
      providerVectorReadExecuted: false,
      realMemoryVectorDataWritten: false,
      persistentModelCacheEnabled: false,
      sqliteSchemaMigrationEnabled: false,
      historicalBatchIndexingEnabled: false
    });
    expect(result.reasonCodes).toEqual([
      "tester_expansion_executed",
      "tester_invitation_sent",
      "real_usage_session_started",
      "environment_read_requested",
      "runtime_or_artifact_access_requested",
      "helper_or_provider_execution_requested",
      "provider_vector_operation_requested",
      "persistent_or_migration_side_effect_requested"
    ]);
  });

  it("blocks unsafe output, UI/default changes, shell execution, release changes, and product SLO declarations", () => {
    const result = evaluateMemoryProviderVectorTesterExpansionDryRunPreflight({
      ...approvedInput(),
      desktopIpcChanged: true,
      uiBehaviorChanged: true,
      providerVisibilityChanged: true,
      defaultOptInChanged: true,
      rawVectorsExposed: true,
      rawTextExposed: true,
      rawDiagnosticsExposed: true,
      privatePathExposed: true,
      signedUrlOrCredentialPersisted: true,
      modelOutputShellExecutionEnabled: true,
      releaseChannelChanged: true,
      installerPolicyChanged: true,
      updateRollbackPolicyChanged: true,
      modelLifecyclePolicyChanged: true,
      cachePolicyChanged: true,
      productSloDeclared: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      desktopIpcChanged: false,
      uiBehaviorChanged: false,
      providerVisibilityChanged: false,
      defaultOptInChanged: false,
      rawVectorsExposed: false,
      rawTextExposed: false,
      rawDiagnosticsExposed: false,
      privatePathExposed: false,
      signedUrlOrCredentialPersisted: false,
      modelOutputShellExecutionEnabled: false,
      releaseChannelChanged: false,
      installerPolicyChanged: false,
      updateRollbackPolicyChanged: false,
      modelLifecyclePolicyChanged: false,
      cachePolicyChanged: false,
      productSloDeclared: false
    });
    expect(result.reasonCodes).toEqual([
      "desktop_ui_or_visibility_change_requested",
      "unsafe_output_or_secret_exposure_requested",
      "shell_execution_requested",
      "release_policy_change_requested",
      "product_slo_declared"
    ]);
  });

  it("returns a deterministic sanitized operator checklist schema", () => {
    const checklist = createMemoryProviderVectorTesterExpansionOperatorChecklist();
    const serialized = JSON.stringify(checklist);

    expect(checklist).toMatchObject({
      mode: "bounded_tester_expansion_operator_checklist",
      scope: "dry_run_preflight_only",
      maximumTesterLimit: 3,
      maximumMessagesPerTester: 5,
      maximumWindowHours: 2,
      testerInvitationsAllowed: false,
      realUsageSessionAllowed: false,
      envReadsAllowed: false,
      artifactAccessAllowed: false,
      helperExecutionAllowed: false,
      providerVectorExecutionAllowed: false,
      uiControlsAllowed: false,
      sqliteMigrationAllowed: false,
      rawOutputAllowed: false,
      shellExecutionAllowed: false
    });
    expect(checklist.checklistItems).toContain(
      "confirm_candidate_roster_policy_without_sending_invitations"
    );
    expect(checklist.rollbackDryRunSteps).toContain(
      "delete_only_exact_model_source_type_source_id_rows"
    );
    expect(checklist.sanitizedReportFields).toContain("unsafeFlags");
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});

function approvedInput(): MemoryProviderVectorTesterExpansionDryRunPreflightInput {
  return {
    phase834ApprovalPacketComplete: true,
    operatorChecklistReviewed: true,
    envGateChecklistReviewed: true,
    rollbackDryRunChecklistReviewed: true,
    sanitizedReportSchemaReviewed: true,
    stopConditionChecklistReviewed: true,
    releaseGateChecklistReviewed: true,
    candidateTesterRosterPolicyReviewed: true,
    consentMessagePolicyReviewed: true,
    verificationClean: true,
    ciVerificationClean: true,
    testerExpansionExecuted: false,
    testerInvitationSent: false,
    realUsageSessionStarted: false,
    envRead: false,
    runtimePythonRead: false,
    modelArtifactPathRead: false,
    artifactAccessed: false,
    helperStarted: false,
    helperLoadCalled: false,
    helperEmbedCalled: false,
    providerExecutionCalled: false,
    providerVectorWriteExecuted: false,
    providerVectorReadExecuted: false,
    realMemoryVectorDataWritten: false,
    persistentModelCacheEnabled: false,
    sqliteSchemaMigrationEnabled: false,
    historicalBatchIndexingEnabled: false,
    desktopIpcChanged: false,
    uiBehaviorChanged: false,
    providerVisibilityChanged: false,
    defaultOptInChanged: false,
    rawVectorsExposed: false,
    rawTextExposed: false,
    rawDiagnosticsExposed: false,
    privatePathExposed: false,
    signedUrlOrCredentialPersisted: false,
    modelOutputShellExecutionEnabled: false,
    releaseChannelChanged: false,
    installerPolicyChanged: false,
    updateRollbackPolicyChanged: false,
    modelLifecyclePolicyChanged: false,
    cachePolicyChanged: false,
    productSloDeclared: false
  };
}
