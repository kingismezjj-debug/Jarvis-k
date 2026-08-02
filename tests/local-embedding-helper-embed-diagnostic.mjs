import {
  runCoreHostLocalEmbeddingHelperEmbedDiagnostic
} from "../apps/core-host/dist/local-embedding-helper-embed-diagnostic-runner.js";

const report = await runCoreHostLocalEmbeddingHelperEmbedDiagnostic({
  env: process.env,
  productApprovalGranted: true,
  securityApprovalGranted: true,
  phase738PreflightComplete: true,
  phase739PreflightComplete: true,
  resourceScheduler: createDiagnosticResourceScheduler()
});

console.log(JSON.stringify(report));
if (report.status !== "passed" && !isLocalConfigurationMissing(report)) {
  process.exitCode = 1;
}

function isLocalConfigurationMissing(report) {
  return (
    report.reasonCodes.includes("diagnostic_opt_in_missing") ||
    report.reasonCodes.includes("runtime_python_missing") ||
    report.reasonCodes.includes("model_directory_missing")
  );
}

function createDiagnosticResourceScheduler() {
  return {
    async acquire(input) {
      return {
        leaseId: "phase-7-40-diagnostic-lease",
        capability: input.capability,
        modelId: input.modelId,
        createdAt: new Date().toISOString(),
        release: async () => undefined
      };
    },
    async diagnostics() {
      return {
        checkedAt: new Date().toISOString(),
        totalMemoryBytes: 0,
        availableMemoryBytes: 0,
        leasedMemoryBytes: 0,
        totalVramBytes: 0,
        availableVramBytes: 0,
        leasedVramBytes: 0,
        activeLeaseCount: 0,
        exclusiveGpuLeaseActive: false
      };
    }
  };
}
