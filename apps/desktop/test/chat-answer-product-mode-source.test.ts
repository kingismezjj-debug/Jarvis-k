import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const desktopSourceDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "src"
);
const mainSource = readFileSync(
  path.join(desktopSourceDirectory, "main.ts"),
  "utf8"
);
const preloadSource = readFileSync(
  path.join(desktopSourceDirectory, "preload.ts"),
  "utf8"
);

describe("Chat Answer product mode desktop wiring", () => {
  it("exposes a default-off in-memory product mode bridge", () => {
    expect(preloadSource).toContain("getChatAnswerProductModeStatus");
    expect(preloadSource).toContain("setChatAnswerProductModeEnabled");
    expect(preloadSource).toContain(
      "IPC_CHAT_ANSWER_PRODUCT_MODE_STATUS_CHANNEL"
    );
    expect(preloadSource).toContain("IPC_CHAT_ANSWER_PRODUCT_MODE_SET_CHANNEL");
    expect(mainSource).toContain("let chatAnswerProductModeEnabled = false");
    expect(mainSource).toContain("getChatAnswerProductModeStatus");
    expect(mainSource).toContain("setChatAnswerProductModeEnabled");
  });

  it("keeps provider-backed runtime explicit and non-default from the product mode toggle", () => {
    expect(mainSource).toContain(
      'status === "control_enabled_runtime_armed"'
    );
    expect(mainSource).toContain("chatAnswerProductModeRuntimeArmed");
    expect(mainSource).toContain("defaultBehaviorChanged: false");
    expect(mainSource).toContain("fallbackPreserved: true");
    expect(mainSource).toContain("CHAT_ANSWER_PRODUCT_MODE_REAL_RUNTIME_ARMED");
    expect(mainSource).toContain("CHAT_ANSWER_PRODUCT_MODE_REAL_RUNTIME_LOCKED");
    expect(mainSource).not.toContain(
      'supervisor?.restart("chat-answer-product-mode'
    );
  });
});
