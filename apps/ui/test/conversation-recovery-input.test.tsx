import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConversationComposer } from "../src/features/conversation/conversation-composer";
import { uiCopy } from "../src/app/copy";
import { TooltipProvider } from "../src/components/ui/tooltip";

describe("trusted recovery projection blocks conversation input", () => {
  it.each(["en", "zh"] as const)("disables editor and send accessibly in %s without removing the existing draft", language => {
    const html = renderToStaticMarkup(<TooltipProvider><ConversationComposer copy={uiCopy[language]} sending={false}
      recoveryBlocked value="Existing draft" onChange={() => undefined} onSubmit={() => undefined} /></TooltipProvider>);
    expect(html).toMatch(/<input[^>]*disabled=""/);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toMatch(/<button[^>]*disabled=""/);
    expect(html).toContain('value="Existing draft"');
    expect(html).not.toMatch(/invalid_journal|SQLite|schema|executionId/);
  });
  it("rejects programmatic form submission and draft changes while blocked", () => {
    const onChange = vi.fn(); const onSubmit = vi.fn(); const preventDefault = vi.fn();
    const form = ConversationComposer({ copy: uiCopy.zh, recoveryBlocked: true, sending: false,
      value: "Existing draft", onChange, onSubmit });
    form.props.onSubmit({ preventDefault });
    form.props.children[0].props.onChange({ target: { value: "Blocked draft" } });
    expect(preventDefault).toHaveBeenCalledOnce(); expect(onSubmit).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
  it("restores normal editing and submission when the trusted block clears", () => {
    const onChange = vi.fn(); const onSubmit = vi.fn();
    const form = ConversationComposer({ copy: uiCopy.zh, recoveryBlocked: false, sending: false,
      value: "Existing draft", onChange, onSubmit });
    form.props.onSubmit({ preventDefault: vi.fn() });
    form.props.children[0].props.onChange({ target: { value: "New draft" } });
    expect(onChange).toHaveBeenCalledWith("New draft"); expect(onSubmit).toHaveBeenCalledOnce();
    const html = renderToStaticMarkup(<TooltipProvider>{form}</TooltipProvider>);
    expect(html).not.toContain('disabled=""'); expect(html).toContain('aria-disabled="false"');
  });
  it("does not change ordinary streaming draft behavior", () => {
    const html = renderToStaticMarkup(<TooltipProvider><ConversationComposer copy={uiCopy.zh} sending recoveryBlocked={false}
      value="Next draft" onChange={() => undefined} onSubmit={() => undefined} /></TooltipProvider>);
    expect(html).not.toMatch(/<input[^>]*disabled=""/); expect(html).toMatch(/<button[^>]*disabled=""/);
  });
});
