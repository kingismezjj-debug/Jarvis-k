import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const runtimeSource = readFileSync(
  path.join(process.cwd(), "packages", "core", "src", "runtime.ts"),
  "utf8",
);

describe("CoreRuntime model operations service integration", () => {
  it("uses model services instead of reintroducing legacy model operation helpers", () => {
    expect(runtimeSource).toContain("new ModelStatusService");
    expect(runtimeSource).toContain("new ModelOperationsService");
    expect(runtimeSource).toContain("new ModelInstallCoordinator");
    expect(runtimeSource).toContain(
      "this.modelOperationsService.executeInferenceOperation",
    );
    expect(runtimeSource).toContain("this.modelStatusService.listModelManifests");
    expect(runtimeSource).toContain("this.modelInstallCoordinator.prepare");
    expect(runtimeSource).not.toContain("private async startModelOperation");
    expect(runtimeSource).not.toContain("private async updateModelOperation");
    expect(runtimeSource).not.toContain("this.modelOperationSupervisor.start(");
    expect(runtimeSource).not.toContain("this.modelOperationSupervisor.update(");
    expect(runtimeSource).not.toContain(
      "this.modelInstallWorkflowOrchestrator.prepare(",
    );
    expect(runtimeSource).not.toContain("this.resourceScheduler.diagnostics(");
  });

  it("keeps runtime model command branches as service delegation", () => {
    expect(commandBranch("agent.getCapabilities")).toContain(
      "this.modelStatusService.inspectCapabilities()",
    );
    expect(commandBranch("agent.listModelOperations")).toContain(
      "this.modelStatusService.listModelOperations",
    );
    expect(commandBranch("agent.getResourceDiagnostics")).toContain(
      "this.modelStatusService.getResourceDiagnostics()",
    );
    expect(commandBranch("agent.previewModelInstallability")).toContain(
      "this.modelStatusService.previewModelInstallability",
    );
    expect(commandBranch("agent.prepareModelInstall")).toContain(
      "this.modelInstallCoordinator.prepare",
    );
  });
});

function commandBranch(commandType: string): string {
  const start = runtimeSource.indexOf(`case "${commandType}"`);
  expect(start, `${commandType} branch is present`).toBeGreaterThanOrEqual(0);
  const next = runtimeSource.indexOf("\n      case ", start + 1);
  const end = next >= 0 ? next : runtimeSource.indexOf("\n      default:", start);
  expect(end, `${commandType} branch has a bounded body`).toBeGreaterThan(start);
  return runtimeSource.slice(start, end);
}
