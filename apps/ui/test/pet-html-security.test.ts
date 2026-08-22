import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Desktop Pet HTML security policy", () => {
  it("allows installed skin images without enabling scripts or network", () => {
    const html = fs.readFileSync(path.resolve("apps", "ui", "pet.html"), "utf8");

    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("img-src 'self' data: jarvis-pet-skin:");
    expect(html).toContain("script-src 'self'");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("object-src 'none'");
    expect(html).not.toContain("unsafe-inline");
    expect(html).not.toContain("jarvis-pet-skin-preview:");
  });
});
