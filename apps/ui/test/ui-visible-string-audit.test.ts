import { describe, expect, it } from "vitest";

const auditModule = await import(
  "../../../scripts/audit-ui-visible-strings.mjs"
);

describe("UI visible string AST audit", () => {
  it("classifies visible strings without relying on plain text grep", () => {
    const observations = auditModule.auditSourceText({
      relativePath: "apps/ui/src/features/example/example.tsx",
      text: `
        export function Example({ copy }) {
          return (
            <section>
              <h1>{copy.settings.general}</h1>
              <button aria-label="Refresh model governance from settings">
                Run diagnostic
              </button>
              <input placeholder="Search settings" />
              <p title="打开设置">Body</p>
              <span>涓枃</span>
            </section>
          );
        }
      `,
    });

    expect(
      observations.some(
        (item: { classification: string; context: string }) =>
          item.classification === "alreadyI18n" &&
          item.context === "i18n_reference",
      ),
    ).toBe(true);
    expect(
      observations.some(
        (item: { classification: string; value: string }) =>
          item.classification === "developerEvaluation" &&
          item.value === "Run diagnostic",
      ),
    ).toBe(true);
    expect(
      observations.some(
        (item: { classification: string; value: string }) =>
          item.classification === "hardcodedChinese" &&
          item.value === "打开设置",
      ),
    ).toBe(true);
    expect(
      observations.some(
        (item: { classification: string; value: string }) =>
          item.classification === "mojibake" && item.value === "涓枃",
      ),
    ).toBe(true);
  });

  it("produces deterministic repository summary counts", () => {
    const summary = auditModule.auditRepositoryStrings();

    expect(summary.filesScanned).toBeGreaterThan(20);
    expect(summary.counts.totalUserVisible).toBeGreaterThan(100);
    expect(summary.counts.alreadyI18n).toBeGreaterThan(50);
    expect(summary.counts.missingI18n).toBeGreaterThan(50);
    expect(summary.topFiles[0].relativePath).toMatch(/^apps\//);
  });
});
