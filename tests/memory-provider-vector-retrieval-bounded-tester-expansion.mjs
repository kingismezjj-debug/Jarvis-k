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
      messageTexts: [
        "Jarvis-K bounded tester expansion synthetic topic one.",
        "Jarvis-K bounded tester expansion synthetic topic two."
      ]
    },
    {
      testerId: "tester-2",
      messageTexts: [
        "Jarvis-K bounded tester expansion synthetic topic three.",
        "Jarvis-K bounded tester expansion synthetic topic four."
      ]
    },
    {
      testerId: "tester-3",
      messageTexts: ["Jarvis-K bounded tester expansion synthetic topic five."]
    }
  ]
});

console.log(JSON.stringify(report));

if (report.status !== "passed") {
  process.exitCode = 1;
}
