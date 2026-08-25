import { describe, expect, it } from "vitest";
import {
  ADVANCED_BRAIN_SCHEMA_VERSION,
  CloudProviderEndpointProfileSchema,
  CloudReasoningTransportRequestSchema,
  CloudReasoningTransportResultSchema,
} from "../src";

describe("Cloud reasoning transport protocol", () => {
  it("accepts a bounded allowlisted endpoint profile", () => {
    const profile = CloudProviderEndpointProfileSchema.parse(profileFixture());

    expect(profile.requiresHttps).toBe(true);
    expect(profile.redirectPolicy).toBe("none");
    expect(profile.allowedOperationPaths[0]?.path).toBe("/v1/reason");
  });

  it("rejects unsafe origins before transport construction", () => {
    for (const origin of [
      "http://reasoning.example",
      "https://user:pass@reasoning.example",
      "https://reasoning.example/path",
      "https://reasoning.example?credential=value",
      "https://reasoning.example/#frag",
      "https://reasoning.example:8443",
      "https://localhost",
      "https://127.0.0.1",
      "https://10.1.2.3",
      "https://172.20.1.5",
      "https://192.168.1.20",
      "https://169.254.1.1",
      "file:///tmp/request.json",
      "data:application/json,{}",
      "blob:https://reasoning.example/id",
      "javascript:alert(1)",
    ]) {
      expect(() =>
        CloudProviderEndpointProfileSchema.parse({
          ...profileFixture(),
          allowedOrigins: [origin],
        }),
      ).toThrow();
    }
  });

  it("rejects arbitrary operation paths and duplicate operations", () => {
    for (const path of [
      "v1/reason",
      "/v1/../admin",
      "/v1\\reason",
      "/v1/reason?credential=value",
      "/v1/reason#frag",
      "/v1//reason",
    ]) {
      expect(() =>
        CloudProviderEndpointProfileSchema.parse({
          ...profileFixture(),
          allowedOperationPaths: [{ operation: "reason.create", path }],
        }),
      ).toThrow();
    }

    expect(() =>
      CloudProviderEndpointProfileSchema.parse({
        ...profileFixture(),
        allowedOperationPaths: [
          { operation: "reason.create", path: "/v1/reason" },
          { operation: "reason.create", path: "/v1/other" },
        ],
      }),
    ).toThrow("Duplicate operation");
  });

  it("keeps transport requests free of arbitrary URLs, headers, and files", () => {
    const request = CloudReasoningTransportRequestSchema.parse(requestFixture());

    expect(request.method).toBe("POST");
    expect(request.contentType).toBe("application/json");
    expect(() =>
      CloudReasoningTransportRequestSchema.parse({
        ...requestFixture(),
        url: "https://reasoning.example/v1/reason",
      }),
    ).toThrow();
    expect(() =>
      CloudReasoningTransportRequestSchema.parse({
        ...requestFixture(),
        headers: { Cookie: "session=value" },
      }),
    ).toThrow();
    expect(() =>
      CloudReasoningTransportRequestSchema.parse({
        ...requestFixture(),
        filePath: "C:\\Users\\Admin\\input.txt",
      }),
    ).toThrow();
  });

  it("keeps transport results sanitized and fail-closed", () => {
    const result = CloudReasoningTransportResultSchema.parse({
      schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
      requestId: "cloud-request-1",
      providerId: "advanced-brain.test",
      deploymentId: "test-deployment",
      operation: "reason.create",
      statusClass: "success",
      reasonCode: "completed",
      httpStatus: 200,
      responseJson: { answer: "ok" },
      safeHeaders: { contentType: "application/json" },
      latencyMs: 5,
      requestSent: true,
      responseStarted: true,
      responseCompleted: true,
      cancelled: false,
      timeout: false,
      automaticRetry: false,
      automaticFallback: false,
      credentialExposed: false,
      requestBodyExposed: false,
      responseBodyLogged: false,
    });

    expect(result.credentialExposed).toBe(false);
    expect(() =>
      CloudReasoningTransportResultSchema.parse({
        ...result,
        credentialExposed: true,
      }),
    ).toThrow();
    expect(() =>
      CloudReasoningTransportResultSchema.parse({
        ...result,
        rawHeaders: { "set-cookie": "x=y" },
      }),
    ).toThrow();
    expect(() =>
      CloudReasoningTransportResultSchema.parse({
        ...result,
        redirectLocation: "https://other.example",
      }),
    ).toThrow();
  });
});

function profileFixture() {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    providerId: "advanced-brain.test",
    deploymentId: "test-deployment",
    trustClass: "jarvis_test",
    allowedOrigins: ["https://reasoning.example"],
    allowedOperationPaths: [{ operation: "reason.create", path: "/v1/reason" }],
    region: "global",
    requiresHttps: true,
    redirectPolicy: "none",
    maxRequestBytes: 2_000,
    maxResponseBytes: 2_000,
    timeoutBounds: {
      minTimeoutMs: 100,
      defaultTimeoutMs: 1_000,
      maxTimeoutMs: 5_000,
    },
    credentialBindingId: "credential-binding-test",
  };
}

function requestFixture() {
  return {
    schemaVersion: ADVANCED_BRAIN_SCHEMA_VERSION,
    requestId: "cloud-request-1",
    providerId: "advanced-brain.test",
    deploymentId: "test-deployment",
    operation: "reason.create",
    method: "POST",
    contentType: "application/json",
    bodyJson: { promptRef: "minimized-input" },
    credentialBindingId: "credential-binding-test",
    timeoutMs: 1_000,
    maxResponseBytes: 2_000,
  };
}
