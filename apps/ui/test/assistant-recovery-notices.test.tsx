import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssistantRecoveryClassificationSchema } from "@jarvis-k/contracts";
import { AssistantRecoveryNotices } from "../src/features/conversation/conversation-message-list";
import { uiCopy } from "../src/app/copy";

describe("localized recovery status separate from assistant content", () => {
  it.each(["en", "zh"] as const)("renders all safe states in %s without old approvals or streaming bubbles", language => {
    const copy = uiCopy[language].assistantRecovery;
    const html = renderToStaticMarkup(<AssistantRecoveryNotices copy={copy} blocked={false}
      notices={AssistantRecoveryClassificationSchema.options.map((classification, index) => ({
        turnId: `turn-private-${index}`, conversationId: "private-conversation", classification,
      }))} />);
    for (const classification of AssistantRecoveryClassificationSchema.options) expect(html).toContain(copy[classification]);
    expect(html.match(/role="status"/g)).toHaveLength(4);
    expect(html).not.toMatch(/button|assistant-streaming-turn|turn-private|private-conversation|localApp|executionId|taskId/);
    expect(html).toContain(copy.label);
  });
  it("shows a safe attention status for quarantine or unavailable storage", () => {
    const html = renderToStaticMarkup(<AssistantRecoveryNotices copy={uiCopy.en.assistantRecovery} notices={[]} blocked />);
    expect(html).toContain(uiCopy.en.assistantRecovery.blocked);
    expect(html).not.toContain("button");
  });
});
