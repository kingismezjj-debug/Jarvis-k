import {
  runMemoryProviderVectorDeveloperAlphaUsage
} from "../apps/core-host/dist/memory-provider-vector-retrieval-developer-alpha-usage.js";

const report = await runMemoryProviderVectorDeveloperAlphaUsage({
  env: process.env,
  productApprovalGranted: true,
  securityApprovalGranted: true,
  releaseApprovalGranted: true,
  phase827ImplementationComplete: true,
  messageTexts: [
    "Jarvis-K alpha test topic: blue notebook.",
    "Jarvis-K alpha recall topic: blue notebook."
  ]
});

console.log(JSON.stringify(report));

if (report.status !== "passed") {
  process.exitCode = 1;
}
