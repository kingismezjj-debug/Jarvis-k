import { runMemoryProviderVectorDeveloperAlphaContinuousUsage } from "../apps/core-host/dist/memory-provider-vector-retrieval-developer-alpha-continuous-usage.js";

const report = await runMemoryProviderVectorDeveloperAlphaContinuousUsage({
  env: process.env,
  productApprovalGranted: true,
  securityApprovalGranted: true,
  releaseApprovalGranted: true,
  phase830PreflightComplete: true,
  messageTexts: [
    "Jarvis-K continuous alpha synthetic topic one.",
    "Jarvis-K continuous alpha synthetic topic two."
  ]
});

console.log(JSON.stringify(report));

if (!["passed", "stopped"].includes(report.status)) {
  process.exitCode = 1;
}
