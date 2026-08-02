import { describe, expect, it } from "vitest";
import {
  createLocalEmbeddingResourceProfileApprovalPolicy,
  evaluateLocalEmbeddingResourceProfileApproval
} from "../src";

const safeCompletedRun = {
  benchmarkRunCompleted: true,
  memorySampleCaptured: true,
  memorySampleCount: 1,
  metricValuesExposed: false,
  metricValuesPersisted: false,
  temporaryWorkspaceCleaned: true,
  failureReportingSanitized: true,
  providerRegistrationEnabled: false,
  executionEnabled: false,
  defaultOptInEnabled: false
};

describe("local embedding resource profile approval", () => {
  it("defines a separate fail-closed product and security gate", () => {
    const policy = createLocalEmbeddingResourceProfileApprovalPolicy();
    const serialized = JSON.stringify(policy);

    expect(policy).toMatchObject({
      runtime: "transformers",
      memoryProfileRequiredBeforeComposition: true,
      productApprovalRequired: true,
      securityApprovalRequired: true,
      metricValuesExposed: false,
      metricValuesPersisted: false,
      temporaryWorkspaceRequired: true,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false,
      compositionAllowed: false
    });
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
  });

  it("keeps the current missing real-model sample deferred", () => {
    const result = evaluateLocalEmbeddingResourceProfileApproval({
      benchmarkRunCompleted: true,
      memorySampleCaptured: false,
      memorySampleCount: 0,
      metricValuesExposed: false,
      metricValuesPersisted: false,
      temporaryWorkspaceCleaned: true,
      failureReportingSanitized: true,
      productApproval: "pending",
      securityApproval: "pending",
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });

    expect(result).toMatchObject({
      status: "deferred_pending_sample",
      accepted: false,
      resourceProfileComplete: false,
      readyForProductSecurityReview: false,
      productApproval: "pending",
      securityApproval: "pending",
      approvalGranted: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
      "A valid real-model memory sample has not been captured.",
      "At least one positive sanitized memory sample is required."
      ])
    );
  });

  it("opens product and security review after a sanitized sample is captured", () => {
    const result = evaluateLocalEmbeddingResourceProfileApproval({
      ...safeCompletedRun,
      productApproval: "pending",
      securityApproval: "pending"
    });

    expect(result).toMatchObject({
      status: "ready_for_product_security_review",
      accepted: false,
      resourceProfileComplete: true,
      readyForProductSecurityReview: true,
      productApproval: "pending",
      securityApproval: "pending",
      approvalGranted: false,
      compositionAllowed: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Independent product approval is still pending.",
        "Independent security approval is still pending."
      ])
    );
  });

  it("records both approvals without granting provider composition", () => {
    const result = evaluateLocalEmbeddingResourceProfileApproval({
      ...safeCompletedRun,
      productApproval: "approved",
      securityApproval: "approved"
    });

    expect(result).toMatchObject({
      status: "approved_for_composition_review",
      accepted: true,
      resourceProfileComplete: true,
      readyForProductSecurityReview: true,
      productApproval: "approved",
      securityApproval: "approved",
      approvalGranted: true,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual([
      "Resource approval does not grant provider composition or execution enablement."
    ]);
  });

  it("blocks unsafe persistence, mutation, rejection, or missing cleanup", () => {
    const result = evaluateLocalEmbeddingResourceProfileApproval({
      ...safeCompletedRun,
      metricValuesExposed: true,
      metricValuesPersisted: true,
      temporaryWorkspaceCleaned: false,
      failureReportingSanitized: false,
      productApproval: "rejected",
      securityApproval: "rejected",
      providerRegistrationEnabled: true,
      executionEnabled: true,
      defaultOptInEnabled: true
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "blocked",
      accepted: false,
      resourceProfileComplete: false,
      readyForProductSecurityReview: false,
      approvalGranted: false,
      compositionAllowed: false,
      providerRegistrationEnabled: false,
      executionEnabled: false,
      defaultOptInEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "Resource metric values must remain hidden from product surfaces.",
        "Resource metric values must not be persisted.",
        "Temporary artifact, model, environment, and cache cleanup is required.",
        "Resource sampling failures must be reported with sanitized reason codes.",
        "Product approval cannot be rejected for this gate.",
        "Security approval cannot be rejected for this gate.",
        "Provider registration must remain disabled.",
        "Execution must remain disabled.",
        "Default opt-in must remain disabled."
      ])
    );
    expect(serialized).not.toMatch(/https?:\/\//u);
    expect(serialized).not.toMatch(/[A-Za-z]:\\/u);
    expect(serialized).not.toMatch(/\b[a-f0-9]{64}\b/u);
  });
});
