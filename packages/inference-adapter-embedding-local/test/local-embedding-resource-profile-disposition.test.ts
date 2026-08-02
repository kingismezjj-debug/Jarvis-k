import { describe, expect, it } from "vitest";
import { evaluateLocalEmbeddingResourceProfileDisposition } from "../src";

const approvedDeferredDisposition = {
  benchmarkRunCompleted: true,
  artifactVerificationPassed: true,
  runtimeBenchmarkPassed: true,
  temporaryWorkspaceCleaned: true,
  memorySampleCaptured: false,
  memorySampleCount: 0,
  sanitizedReasonCode: "memory_probe_failed" as const,
  productApproval: "approved" as const,
  securityApproval: "approved" as const,
  metricValuesExposed: false,
  metricValuesPersisted: false,
  coreHostCompositionChanged: false,
  providerRegistrationEnabled: false,
  executionEnabled: false,
  defaultOptInEnabled: false
};

describe("local embedding resource profile disposition", () => {
  it("records a sanitized deferred disposition without satisfying readiness", () => {
    const result = evaluateLocalEmbeddingResourceProfileDisposition(
      approvedDeferredDisposition
    );
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "recorded_deferred_diagnostic_gap",
      accepted: true,
      dispositionRecorded: true,
      resourceProfileComplete: false,
      readinessSatisfied: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      checks: {
        benchmarkRunCompleted: true,
        artifactVerificationPassed: true,
        runtimeBenchmarkPassed: true,
        temporaryWorkspaceCleaned: true,
        missingMemorySampleConfirmed: true,
        sampleCountBoundedZero: true,
        sanitizedReasonCodeAllowed: true,
        productApprovalGranted: true,
        securityApprovalGranted: true,
        metricValuesHidden: true,
        metricValuesNotPersisted: true,
        coreHostCompositionUnchanged: true,
        providerRegistrationDisabled: true,
        executionDisabled: true,
        defaultOptInDisabled: true
      },
      reasons: [
        "Memory sampling gap is formally dispositioned as deferred and does not satisfy readiness."
      ]
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });

  it("blocks disposition if a raw metric value is carried through", () => {
    const result = evaluateLocalEmbeddingResourceProfileDisposition({
      ...approvedDeferredDisposition,
      memorySampleCaptured: true,
      memorySampleCount: 1,
      metricValuesExposed: true,
      metricValuesPersisted: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      dispositionRecorded: false,
      resourceProfileComplete: false,
      readinessSatisfied: false,
      compositionAllowed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Disposition applies only to a confirmed missing memory sample.",
        "Disposition must not carry a memory sample value.",
        "Resource metric values must remain hidden.",
        "Resource metric values must not be persisted."
      ])
    );
  });

  it("blocks unapproved or unclean disposition attempts", () => {
    const result = evaluateLocalEmbeddingResourceProfileDisposition({
      ...approvedDeferredDisposition,
      temporaryWorkspaceCleaned: false,
      sanitizedReasonCode: "unknown" as never,
      productApproval: "pending",
      securityApproval: "rejected"
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      dispositionRecorded: false,
      compositionAllowed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Temporary workspace and cache cleanup must pass.",
        "Disposition requires an allowed sanitized reason code.",
        "Product approval for diagnostic-only use is required.",
        "Security approval for the temporary benchmark is required."
      ])
    );
  });

  it("blocks provider registration, execution, default opt-in, or Core Host changes", () => {
    const result = evaluateLocalEmbeddingResourceProfileDisposition({
      ...approvedDeferredDisposition,
      coreHostCompositionChanged: true,
      providerRegistrationEnabled: true,
      executionEnabled: true,
      defaultOptInEnabled: true
    });

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      dispositionRecorded: false,
      resourceProfileComplete: false,
      readinessSatisfied: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Core Host composition must remain unchanged.",
        "Provider registration must remain disabled.",
        "Execution must remain disabled.",
        "Default opt-in must remain disabled."
      ])
    );
  });
});
