import type {
  CoreMemoryRecallFailureClass,
  CoreMemoryRetrievalFailureClassificationInput
} from "@jarvis-k/core";
import {
  createRuntimeHelperSanitizedError,
  type RuntimeHelperErrorCode
} from "@jarvis-k/inference-runtime-transformers-local";

export const CORE_HOST_MEMORY_RETRIEVAL_FAILURE_CLASSES = [
  "QUERY_EMBEDDING_TIMEOUT",
  "QUERY_EMBEDDING_FAILED",
  "VECTOR_QUERY_EXECUTION_FAILED",
  "VECTOR_QUERY_RESULT_INVALID",
  "HELPER_LIFECYCLE_FAILED",
  "MEMORY_RETRIEVAL_ROUTING_FAILED"
] as const satisfies readonly CoreMemoryRecallFailureClass[];

export function isCoreHostMemoryRetrievalFailureClass(
  value: unknown
): value is CoreMemoryRecallFailureClass {
  return (
    typeof value === "string" &&
    (CORE_HOST_MEMORY_RETRIEVAL_FAILURE_CLASSES as readonly string[]).includes(
      value
    )
  );
}

const HELPER_LIFECYCLE_ERROR_CODES = new Set<RuntimeHelperErrorCode>([
  "HELPER_UNAVAILABLE",
  "HELPER_STARTUP_TIMEOUT",
  "HELPER_SHUTDOWN_TIMEOUT",
  "HELPER_PROCESS_EXITED",
  "MODEL_LOAD_UNAVAILABLE",
  "RUNTIME_DEPENDENCY_UNAVAILABLE",
  "MODEL_ARTIFACT_UNAVAILABLE",
  "MODEL_RUNTIME_INCOMPATIBLE",
  "RESOURCE_LEASE_REQUIRED"
]);

const QUERY_EMBEDDING_TIMEOUT_ERROR_CODES = new Set<RuntimeHelperErrorCode>([
  "HELPER_REQUEST_TIMEOUT"
]);

export function classifyCoreHostMemoryRetrievalFailure(
  input: CoreMemoryRetrievalFailureClassificationInput
): CoreMemoryRecallFailureClass {
  if (input.stage === "vector_query_result") {
    if (input.reasonCode === "VECTOR_QUERY_EXECUTION_FAILED") {
      return "VECTOR_QUERY_EXECUTION_FAILED";
    }
    if (
      input.reasonCode === undefined ||
      input.reasonCode === "VECTOR_QUERY_INVALID" ||
      input.reasonCode === "VECTOR_SCHEMA_UNAVAILABLE" ||
      input.reasonCode === "VECTOR_NON_FIXTURE_QUERY_BLOCKED"
    ) {
      return "VECTOR_QUERY_RESULT_INVALID";
    }
    return "MEMORY_RETRIEVAL_ROUTING_FAILED";
  }

  if (input.stage === "vector_query") {
    return "VECTOR_QUERY_EXECUTION_FAILED";
  }

  const helperCode = runtimeHelperCodeFromError(input.error);
  if (helperCode !== undefined) {
    if (QUERY_EMBEDDING_TIMEOUT_ERROR_CODES.has(helperCode)) {
      return "QUERY_EMBEDDING_TIMEOUT";
    }
    if (HELPER_LIFECYCLE_ERROR_CODES.has(helperCode)) {
      return "HELPER_LIFECYCLE_FAILED";
    }
  }
  return "QUERY_EMBEDDING_FAILED";
}

function runtimeHelperCodeFromError(
  error: unknown
): RuntimeHelperErrorCode | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const message = error.message;
  const codes: readonly RuntimeHelperErrorCode[] = [
    "HELPER_UNAVAILABLE",
    "HELPER_STARTUP_TIMEOUT",
    "HELPER_SHUTDOWN_TIMEOUT",
    "HELPER_REQUEST_TIMEOUT",
    "HELPER_PROTOCOL_INVALID",
    "RESOURCE_LEASE_REQUIRED",
    "MODEL_LOAD_UNAVAILABLE",
    "RUNTIME_DEPENDENCY_UNAVAILABLE",
    "MODEL_ARTIFACT_UNAVAILABLE",
    "MODEL_RUNTIME_INCOMPATIBLE",
    "EMBEDDING_DIMENSIONS_UNSUPPORTED",
    "EMBEDDING_EXECUTION_DISABLED",
    "HELPER_PROCESS_EXITED",
    "HELPER_INTERNAL"
  ];
  for (const code of codes) {
    if (
      message === code ||
      message === createRuntimeHelperSanitizedError(code).message
    ) {
      return code;
    }
  }
  return undefined;
}
