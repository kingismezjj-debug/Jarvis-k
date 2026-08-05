import { describe, expect, it } from "vitest";
import {
  classifyCoreHostMemoryRetrievalFailure,
  CORE_HOST_MEMORY_RETRIEVAL_FAILURE_CLASSES
} from "../src/memory-retrieval-failure-classification";

describe("Core Host memory retrieval failure classification", () => {
  it("maps helper timeout and lifecycle failures to fixed classes", () => {
    expect(
      classifyCoreHostMemoryRetrievalFailure({
        stage: "query_embedding",
        error: new Error("Runtime helper request timed out.")
      })
    ).toBe("QUERY_EMBEDDING_TIMEOUT");
    expect(
      classifyCoreHostMemoryRetrievalFailure({
        stage: "query_embedding",
        error: new Error(
          "C:\\Users\\Administrator\\private-helper\\model-cache"
        )
      })
    ).toBe("QUERY_EMBEDDING_FAILED");
    expect(
      classifyCoreHostMemoryRetrievalFailure({
        stage: "query_embedding",
        error: new Error("Runtime helper startup timed out.")
      })
    ).toBe("HELPER_LIFECYCLE_FAILED");
  });

  it("maps vector query outcomes without returning raw failure text", () => {
    const classes = [
      classifyCoreHostMemoryRetrievalFailure({
        stage: "vector_query",
        error: new Error("database failure at C:\\private\\memory.sqlite")
      }),
      classifyCoreHostMemoryRetrievalFailure({
        stage: "vector_query_result",
        reasonCode: "VECTOR_QUERY_INVALID"
      }),
      classifyCoreHostMemoryRetrievalFailure({
        stage: "vector_query_result",
        reasonCode: "VECTOR_QUERY_EXECUTION_FAILED"
      })
    ];

    expect(classes).toEqual([
      "VECTOR_QUERY_EXECUTION_FAILED",
      "VECTOR_QUERY_RESULT_INVALID",
      "VECTOR_QUERY_EXECUTION_FAILED"
    ]);
    expect(JSON.stringify({ classes })).not.toContain("private");
    expect(classes.every((item) => CORE_HOST_MEMORY_RETRIEVAL_FAILURE_CLASSES.includes(item))).toBe(
      true
    );
  });
});
