import { runMemoryProviderVectorBoundedTesterExpansionExecution } from "../apps/core-host/dist/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run.js";

const report = await runMemoryProviderVectorBoundedTesterExpansionExecution({
  env: process.env,
  productApprovalGranted: true,
  securityApprovalGranted: true,
  releaseApprovalGranted: true,
  phase836PreflightComplete: true,
  testers: [
    {
      testerId: "tester-1",
      messageTexts: ["Jarvis-K Phase 8.37 minimum diagnostic synthetic message."]
    }
  ]
});

console.log(JSON.stringify(report));

if (report.status !== "passed") {
  process.exitCode = 1;
}
