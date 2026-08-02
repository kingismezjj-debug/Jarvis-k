import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic
} from "../apps/core-host/dist/local-embedding-provider-execution-acceptance-diagnostic.js";

const tempRoot = await mkdtemp(
  path.join(os.tmpdir(), "jarvis-k-local-embedding-provider-acceptance-")
);
const tempModelRoot = path.join(tempRoot, "models");
const tempMemoryPath = path.join(tempRoot, "memory.sqlite");

try {
  await mkdir(tempModelRoot, { recursive: true });
  const report =
    await runCoreHostLocalEmbeddingProviderExecutionAcceptanceDiagnostic({
      env: process.env,
      productApprovalGranted: true,
      securityApprovalGranted: true,
      phase742ProviderExecutionWiringComplete: true,
      temporaryMemoryDatabasePath: tempMemoryPath,
      temporaryModelDirectoryPath: tempModelRoot
    });

  console.log(JSON.stringify(report));
  if (report.status !== "passed" && !isLocalConfigurationMissing(report)) {
    process.exitCode = 1;
  }
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}

function isLocalConfigurationMissing(report) {
  return [
    "acceptance_opt_in_missing",
    "provider_opt_in_missing",
    "provider_execution_opt_in_missing",
    "runtime_python_missing",
    "model_directory_missing"
  ].some((reasonCode) => report.reasonCodes.includes(reasonCode));
}
