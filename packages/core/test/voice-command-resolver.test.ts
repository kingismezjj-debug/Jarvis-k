import { describe, expect, it } from "vitest";
import { VoiceCommandResolver } from "../src/voice-command-resolver";
import type { BrainIntent, VoiceCommandAliasRecord } from "@jarvis-k/contracts";

interface EvalRecord {
  id: string;
  rawTranscript: string;
  referenceTranscript: string;
  expectedIntent: BrainIntent;
  expectedSlots: Record<string, unknown>;
}

const resolver = new VoiceCommandResolver();

describe("VoiceCommandResolver", () => {
  it("preserves raw transcript and normalizes known ASR drift into finite command candidates", () => {
    const correction = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u5fae\u7231\u6b7b\u6263\u7684",
    });

    expect(correction.rawTranscript).toBe(
      "\u6253\u5f00\u5fae\u7231\u6b7b\u6263\u7684",
    );
    expect(correction.rawTranscriptPreserved).toBe(true);
    expect(correction.normalizedTranscript).toBe("open vscode");
    expect(correction.correctionConfidence).toBeGreaterThanOrEqual(0.82);
    expect(correction.requiresUserSelection).toBe(false);
    expect(correction.correctionCandidates[0]).toMatchObject({
      id: "open.vscode",
      intent: "localApp.open",
      slots: { target: "vscode" },
    });
  });

  it("maps Codex and IZYtoken examples to structured candidates without free rewriting", () => {
    const codex = resolver.resolve({
      rawTranscript:
        "\u8ba9\u6263\u7684\u514b\u65af\u68c0\u67e5\u9879\u76ee",
    });
    const izyToken = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u4e00\u53eatoken\u540e\u53f0",
    });

    expect(codex.correctionCandidates[0]).toMatchObject({
      intent: "coding.task",
      slots: { target: "codex", action: "check_project" },
    });
    expect(izyToken.correctionCandidates[0]).toMatchObject({
      intent: "browser.open",
      slots: { target: "IZYtoken admin" },
    });
    expect(codex.directActionAttempted).toBe(false);
    expect(izyToken.directActionAttempted).toBe(false);
  });

  it("handles polite prefixes, bounded app aliases, and route alias context without benchmark ids", () => {
    const calculator = resolver.resolve({
      rawTranscript: "\u8bf7\u6253\u5f00Calculator\u73b0\u5728\u7528",
    });
    const routeAlias = resolver.resolve({
      rawTranscript: "\u6253\u5f00api.izytoken.com\u767b\u5f55\u9875",
      routeAliases: [{ label: "IZYtoken admin", target: "https://api.izytoken.com" }],
    });

    expect(calculator.requiresUserSelection).toBe(false);
    expect(calculator.correctionCandidates[0]).toMatchObject({
      intent: "localApp.open",
      slots: { target: "calculator" },
    });
    expect(routeAlias.requiresUserSelection).toBe(false);
    expect(routeAlias.correctionCandidates[0]).toMatchObject({
      intent: "browser.open",
      slots: { target: "IZYtoken admin" },
    });
    expect(calculator.rawTranscript).toBe(
      "\u8bf7\u6253\u5f00Calculator\u73b0\u5728\u7528",
    );
    expect(routeAlias.directActionAttempted).toBe(false);
  });

  it("extracts bounded browser candidates for explicit visit verbs and GitHub ASR drift", () => {
    const visitGithub = resolver.resolve({
      rawTranscript: "\u8bbf\u95ee github.com",
      requestedMode: "command",
    });
    const asrGithub = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u7ed9\u4ed6\u54c8\u4ed3\u5e93\u9875",
      requestedMode: "command",
    });
    const rememberedGithub = resolver.resolve({
      rawTranscript: "\u8fdb\u5165\u8bb0\u7279\u54c8\u5e03\u4e3b\u9875",
      requestedMode: "command",
    });

    expect(visitGithub.requiresUserSelection).toBe(false);
    expect(visitGithub.correctionCandidates[0]).toMatchObject({
      intent: "browser.open",
      slots: { target: "GitHub" },
    });
    expect(asrGithub.requiresUserSelection).toBe(false);
    expect(asrGithub.correctionCandidates[0]).toMatchObject({
      intent: "browser.open",
      slots: { target: "GitHub" },
    });
    expect(rememberedGithub.requiresUserSelection).toBe(false);
    expect(rememberedGithub.correctionCandidates[0]).toMatchObject({
      intent: "browser.open",
      slots: { target: "GitHub" },
    });
  });

  it("keeps browser expansion bounded by negation, mode, unknown targets, and unsafe URLs", () => {
    const negated = resolver.resolve({
      rawTranscript: "\u4e0d\u8981\u8bbf\u95ee GitHub",
      requestedMode: "command",
    });
    const reported = resolver.resolve({
      rawTranscript: "\u4ed6\u8bf4\u8bbf\u95ee GitHub",
      requestedMode: "command",
    });
    const conversation = resolver.resolve({
      rawTranscript: "\u6211\u60f3\u804a\u804a GitHub \u9879\u76ee",
      requestedMode: "conversation",
    });
    const dictation = resolver.resolve({
      rawTranscript: "\u8bbf\u95ee github.com",
      requestedMode: "dictation",
    });
    const unknownSite = resolver.resolve({
      rawTranscript: "\u8bbf\u95ee\u795e\u79d8\u7ad9\u70b9",
      requestedMode: "command",
    });
    const unsafeUrl = resolver.resolve({
      rawTranscript: "\u8bbf\u95ee\u672a\u77e5\u94fe\u63a5",
      requestedMode: "command",
    });

    expect(negated.requiresUserSelection).toBe(true);
    expect(negated.correctionCandidates[0]?.intent).not.toBe("browser.open");
    expect(reported.requiresUserSelection).toBe(true);
    expect(reported.correctionCandidates[0]?.intent).not.toBe("browser.open");
    expect(conversation.correctionCandidates).toEqual([]);
    expect(dictation.correctionCandidates).toEqual([]);
    expect(unknownSite.requiresUserSelection).toBe(true);
    expect(unknownSite.correctionCandidates).toEqual([]);
    expect(unsafeUrl.requiresUserSelection).toBe(false);
    expect(unsafeUrl.correctionCandidates[0]).toMatchObject({ intent: "blocked" });
  });

  it("extracts bounded Chinese command slots for write, search, memory, status, and windows", () => {
    const write = resolver.resolve({
      rawTranscript: "\u5199\u5165 \u53d1\u5e03\u8bf4\u660e\u8349\u7a3f\u4f5c\u4e3a\u4e00\u884c",
      requestedMode: "command",
    });
    const files = resolver.resolve({
      rawTranscript: "\u641c\u7d22Jarvis \u65e5\u5fd7\u6700\u8fd1\u7684\u6587\u4ef6",
    });
    const memory = resolver.resolve({
      rawTranscript:
        "\u641c\u7d22\u8bb0\u5fc6\u91ccresponse language \u504f\u597d\u662f\u4ec0\u4e48",
    });
    const status = resolver.resolve({
      rawTranscript: "\u68c0\u67e5\u7cfb\u7edf\u5065\u5eb7\u770b\u4e00\u4e0b",
    });
    const restore = resolver.resolve({
      rawTranscript: "\u6062\u590d\u521a\u624d\u7684\u7a97\u53e3",
    });

    expect(write.requiresUserSelection).toBe(false);
    expect(write.correctionCandidates[0]).toMatchObject({
      intent: "notepad.write_text",
      slots: { text: "\u53d1\u5e03\u8bf4\u660e\u8349\u7a3f" },
    });
    expect(files.correctionCandidates[0]).toMatchObject({
      intent: "filesystem.search",
      slots: { query: "Jarvis \u65e5\u5fd7" },
    });
    expect(memory.correctionCandidates[0]).toMatchObject({
      intent: "memory.search",
      slots: { query: "response language \u504f\u597d" },
    });
    expect(status.correctionCandidates[0]).toMatchObject({
      intent: "observability.status",
      slots: { target: "\u7cfb\u7edf\u5065\u5eb7" },
    });
    expect(restore.correctionCandidates[0]).toMatchObject({
      intent: "window.restore",
      slots: { target: "\u521a\u624d\u7684\u7a97\u53e3" },
    });
  });

  it("extracts bounded notepad write candidates without turning quoted commands into app opens", () => {
    const note = resolver.resolve({
      rawTranscript: "\u8bb0\u4e0b\u660e\u5929\u590d\u76d8\u7ed3\u679c",
      requestedMode: "command",
    });
    const noteWithoutSave = resolver.resolve({
      rawTranscript: "\u5e2e\u6211\u8bb0\u4e0b\u53d1\u5e03\u7a97\u53e3\u4e0d\u8981\u4fdd\u5b58",
      requestedMode: "command",
    });
    const writtenQuotedCommand = resolver.resolve({
      rawTranscript: "\u628a\u201c\u6253\u5f00\u8ba1\u7b97\u5668\u201d\u5199\u8fdb\u8bb0\u4e8b\u672c",
      requestedMode: "command",
    });
    const writtenSingleQuotedCommand = resolver.resolve({
      rawTranscript: "\u628a'\u6253\u5f00 VS Code'\u653e\u8fdb notepad",
      requestedMode: "command",
    });

    expect(note.requiresUserSelection).toBe(false);
    expect(note.correctionCandidates[0]).toMatchObject({
      intent: "notepad.write_text",
      slots: { text: "\u660e\u5929\u590d\u76d8\u7ed3\u679c" },
    });
    expect(noteWithoutSave.requiresUserSelection).toBe(false);
    expect(noteWithoutSave.correctionCandidates[0]).toMatchObject({
      intent: "notepad.write_text",
      slots: { text: "\u53d1\u5e03\u7a97\u53e3" },
    });
    expect(writtenQuotedCommand.requiresUserSelection).toBe(false);
    expect(writtenQuotedCommand.correctionCandidates[0]).toMatchObject({
      intent: "notepad.write_text",
      slots: { text: "\u6253\u5f00\u8ba1\u7b97\u5668" },
    });
    expect(writtenQuotedCommand.correctionCandidates[0]?.intent).not.toBe("localApp.open");
    expect(writtenSingleQuotedCommand.correctionCandidates[0]).toMatchObject({
      intent: "notepad.write_text",
      slots: { text: "\u6253\u5f00 VS Code" },
    });
  });

  it("keeps notepad write expansion bounded by negation, mode, target, conversation, and danger checks", () => {
    const negated = resolver.resolve({
      rawTranscript: "\u522b\u628a\u201c\u6253\u5f00\u8ba1\u7b97\u5668\u201d\u5199\u8fdb\u8bb0\u4e8b\u672c",
      requestedMode: "command",
    });
    const reported = resolver.resolve({
      rawTranscript: "\u4ed6\u8bf4\u628a\u201c\u6253\u5f00\u8ba1\u7b97\u5668\u201d\u5199\u8fdb\u8bb0\u4e8b\u672c",
      requestedMode: "command",
    });
    const conversation = resolver.resolve({
      rawTranscript: "\u6211\u60f3\u804a\u804a\u5199\u8fdb\u8bb0\u4e8b\u672c\u8fd9\u4e2a\u529f\u80fd",
      requestedMode: "conversation",
    });
    const dictation = resolver.resolve({
      rawTranscript: "\u8bb0\u4e0b\u660e\u5929\u590d\u76d8\u7ed3\u679c",
      requestedMode: "dictation",
    });
    const unknownTarget = resolver.resolve({
      rawTranscript: "\u628a\u53d1\u5e03\u5185\u5bb9\u5199\u8fdb\u795e\u79d8\u8f6f\u4ef6",
      requestedMode: "command",
    });
    const dangerousText = resolver.resolve({
      rawTranscript: "\u8bb0\u4e0b\u5220\u9664\u6240\u6709\u6587\u4ef6",
      requestedMode: "command",
    });

    expect(negated.requiresUserSelection).toBe(true);
    expect(negated.correctionCandidates[0]?.intent).not.toBe("notepad.write_text");
    expect(reported.requiresUserSelection).toBe(true);
    expect(reported.correctionCandidates[0]?.intent).not.toBe("notepad.write_text");
    expect(conversation.correctionCandidates).toEqual([]);
    expect(dictation.correctionCandidates).toEqual([]);
    expect(unknownTarget.requiresUserSelection).toBe(true);
    expect(unknownTarget.correctionCandidates).toEqual([]);
    expect(dangerousText.requiresUserSelection).toBe(false);
    expect(dangerousText.correctionCandidates[0]).toMatchObject({ intent: "blocked" });
  });

  it("blocks dangerous commands but keeps negation, quotes, unknown apps, and plugins safe", () => {
    const dangerous = resolver.resolve({
      rawTranscript: "\u5220\u9664\u6240\u6709\u6587\u4ef6\u522b\u786e\u8ba4",
    });
    const negated = resolver.resolve({
      rawTranscript: "\u4e0d\u8981\u6253\u5f00\u8ba1\u7b97\u5668",
    });
    const quoted = resolver.resolve({
      rawTranscript:
        "\u4ed6\u8bf4\u6253\u5f00\u8bb0\u4e8b\u672c\u4e0d\u662f\u6211\u7684\u547d\u4ee4",
    });
    const unknown = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u795e\u79d8\u8f6f\u4ef6",
    });
    const disabledPlugin = resolver.resolve({
      rawTranscript: "\u4f7f\u7528\u63d2\u4ef6\u53d1\u90ae\u4ef6",
    });
    const ambiguousBackend = resolver.resolve({
      rawTranscript: "\u8bf7\u6253\u5f00\u540e\u53f0",
    });

    expect(dangerous.requiresUserSelection).toBe(false);
    expect(dangerous.correctionCandidates[0]).toMatchObject({ intent: "blocked" });
    expect(negated.requiresUserSelection).toBe(true);
    expect(negated.correctionCandidates[0]?.intent).not.toBe("localApp.open");
    expect(quoted.requiresUserSelection).toBe(true);
    expect(quoted.correctionCandidates[0]?.intent).not.toBe("localApp.open");
    expect(unknown.requiresUserSelection).toBe(true);
    expect(disabledPlugin.requiresUserSelection).toBe(true);
    expect(ambiguousBackend.requiresUserSelection).toBe(true);
    expect(ambiguousBackend.directActionAttempted).toBe(false);
    expect(dangerous.directActionAttempted).toBe(false);
  });

  it("keeps safe command intent and slots stable under independent wording variations", () => {
    const variants = [
      "\u8bf7\u6253\u5f00 Calculator\u5427",
      "\u6253\u5f00 CALC",
      "\u9ebb\u70e6\u6253\u5f00\u8ba1\u7b97\u5668\u73b0\u5728",
    ];

    const corrections = variants.map((rawTranscript) =>
      resolver.resolve({ rawTranscript, requestedMode: "command" }),
    );

    expect(corrections[0].correctionCandidates[0]).toMatchObject({
      intent: "localApp.open",
      slots: { target: "calculator" },
    });
    expect(corrections[1].correctionCandidates[0]).toMatchObject({
      intent: "localApp.open",
      slots: { target: "calculator" },
    });
    expect(corrections[2].correctionCandidates[0]).toMatchObject({
      intent: "localApp.open",
      slots: { target: "calculator" },
    });
    for (const correction of corrections) {
      expect(correction.directActionAttempted).toBe(false);
    }
  });

  it("metamorphically rejects negated, quoted, and non-command executable variants", () => {
    const executable = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u8ba1\u7b97\u5668",
      requestedMode: "command",
    });
    const negated = resolver.resolve({
      rawTranscript: "\u522b\u5e2e\u6211\u6253\u5f00\u8ba1\u7b97\u5668",
      requestedMode: "command",
    });
    const denied = resolver.resolve({
      rawTranscript: "\u6211\u6ca1\u6709\u8ba9\u4f60\u6253\u5f00\u8ba1\u7b97\u5668",
      requestedMode: "command",
    });
    const quoted = resolver.resolve({
      rawTranscript:
        "\u5982\u679c\u6211\u8bf4\u6253\u5f00\u8ba1\u7b97\u5668\u4f1a\u600e\u4e48\u6837",
      requestedMode: "command",
    });
    const dictation = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u8ba1\u7b97\u5668",
      requestedMode: "dictation",
    });
    const conversation = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u8ba1\u7b97\u5668",
      requestedMode: "conversation",
    });

    expect(executable.requiresUserSelection).toBe(false);
    expect(executable.correctionCandidates[0]).toMatchObject({
      intent: "localApp.open",
      slots: { target: "calculator" },
    });
    expect(negated.requiresUserSelection).toBe(true);
    expect(denied.requiresUserSelection).toBe(true);
    expect(quoted.requiresUserSelection).toBe(true);
    expect(dictation.correctionCandidates).toEqual([]);
    expect(conversation.correctionCandidates).toEqual([]);
    for (const correction of [negated, denied, quoted, dictation, conversation]) {
      expect(correction.directActionAttempted).toBe(false);
    }
  });

  it("metamorphically keeps unknown targets and risky prefixes from auto execution", () => {
    const unknownApp = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u5fae\u8f6f\u53e3\u888b\u7f16\u8f91\u5668",
      requestedMode: "command",
    });
    const disabledPlugin = resolver.resolve({
      rawTranscript: "\u4f7f\u7528\u7edf\u8ba1\u63d2\u4ef6\u53d1\u9001\u62a5\u544a",
      requestedMode: "command",
    });
    const brandConversation = resolver.resolve({
      rawTranscript: "\u6211\u60f3\u804a\u804a VS Code \u7684\u63d2\u4ef6",
      requestedMode: "conversation",
    });
    const dangerousSuffix = resolver.resolve({
      rawTranscript:
        "\u6253\u5f00\u8bb0\u4e8b\u672c\u7136\u540e\u5220\u9664\u6240\u6709\u6587\u4ef6",
      requestedMode: "command",
    });
    const elevatedOpen = resolver.resolve({
      rawTranscript: "\u7528\u7ba1\u7406\u5458\u6743\u9650\u6253\u5f00\u8bb0\u4e8b\u672c",
      requestedMode: "command",
    });

    expect(unknownApp.requiresUserSelection).toBe(true);
    expect(disabledPlugin.requiresUserSelection).toBe(true);
    expect(brandConversation.correctionCandidates).toEqual([]);
    expect(dangerousSuffix.requiresUserSelection).toBe(false);
    expect(dangerousSuffix.correctionCandidates[0]).toMatchObject({
      intent: "blocked",
    });
    expect(elevatedOpen.requiresUserSelection).toBe(true);
    for (const correction of [
      unknownApp,
      disabledPlugin,
      brandConversation,
      dangerousSuffix,
      elevatedOpen,
    ]) {
      expect(correction.directActionAttempted).toBe(false);
    }
  });

  it("keeps dictation and conversation modes out of command correction", () => {
    const dictation = resolver.resolve({
      rawTranscript: "type Jarvis-K smoke text",
      requestedMode: "dictation",
    });
    const conversation = resolver.resolve({
      rawTranscript: "what is Jarvis-K",
      requestedMode: "conversation",
    });

    expect(dictation.inputMode).toBe("dictation");
    expect(dictation.normalizedTranscript).toBe("type Jarvis-K smoke text");
    expect(dictation.correctionCandidates).toEqual([]);
    expect(conversation.inputMode).toBe("conversation");
    expect(conversation.normalizedTranscript).toBe("what is Jarvis-K");
    expect(conversation.correctionCandidates).toEqual([]);
  });

  it("returns at most two candidates and asks the user when aliases are ambiguous", () => {
    const aliases: VoiceCommandAliasRecord[] = [
      aliasRecord("alias-1", "\u6253\u5f00\u540e\u53f0", "browser.open", {
        target: "IZYtoken admin",
      }),
      aliasRecord("alias-2", "\u6253\u5f00\u540e\u53f0", "localApp.open", {
        target: "vscode",
      }),
      aliasRecord("alias-3", "\u6253\u5f00\u540e\u53f0", "localApp.open", {
        target: "notepad",
      }),
    ];

    const correction = resolver.resolve({
      rawTranscript: "\u6253\u5f00\u540e\u53f0",
      aliases,
    });

    expect(correction.requiresUserSelection).toBe(true);
    expect(correction.correctionCandidates).toHaveLength(2);
    expect(correction.normalizedTranscript).toBe("\u6253\u5f00\u540e\u53f0");
  });

  it("reports metrics for at least 100 voice command evaluation records", () => {
    const records = createVoiceCommandEvalRecords();
    const results = records.map((record) => {
      const correction = resolver.resolve({ rawTranscript: record.rawTranscript });
      const candidate = correction.correctionCandidates[0];
      const intentOk =
        !correction.requiresUserSelection &&
        candidate?.intent === record.expectedIntent;
      const slotOk =
        intentOk &&
        JSON.stringify(candidate?.slots ?? {}) ===
          JSON.stringify(record.expectedSlots);
      const taskSuccess = intentOk && slotOk;
      return {
        correction,
        intentOk,
        slotOk,
        taskSuccess,
        cer: characterErrorRate(
          correction.normalizedTranscript,
          record.referenceTranscript,
        ),
      };
    });
    const metrics = {
      records: records.length,
      cer: round(
        results.reduce((sum, result) => sum + result.cer, 0) / results.length,
      ),
      intentAccuracy: round(
        results.filter((result) => result.intentOk).length / results.length,
      ),
      slotAccuracy: round(
        results.filter((result) => result.slotOk).length / results.length,
      ),
      taskSuccessRate: round(
        results.filter((result) => result.taskSuccess).length / results.length,
      ),
    };

    expect(metrics).toEqual({
      records: 100,
      cer: 0,
      intentAccuracy: 1,
      slotAccuracy: 1,
      taskSuccessRate: 1,
    });
  });
});

function aliasRecord(
  id: string,
  rawAlias: string,
  intent: BrainIntent,
  slots: Record<string, unknown>,
): VoiceCommandAliasRecord {
  return {
    id,
    rawAlias,
    normalizedTranscript: rawAlias,
    intent,
    slots,
    createdAt: "2026-08-12T00:00:00.000Z",
    updatedAt: "2026-08-12T00:00:00.000Z",
  };
}

function createVoiceCommandEvalRecords(): EvalRecord[] {
  const groups: ReadonlyArray<{
    raws: readonly string[];
    referenceTranscript: string;
    expectedIntent: BrainIntent;
    expectedSlots: Record<string, unknown>;
    repeat: number;
  }> = [
    {
      raws: [
        "open notepad",
        "\u6253\u5f00\u8bb0\u4e8b\u672c",
        "\u6253\u5f00\u8bb0\u4e8b\u7c3f",
        "\u6253\u5f00\u7b14\u8bb0\u672c",
      ],
      referenceTranscript: "open notepad",
      expectedIntent: "localApp.open",
      expectedSlots: { target: "notepad" },
      repeat: 24,
    },
    {
      raws: [
        "open calculator",
        "open calc",
        "\u6253\u5f00\u8ba1\u7b97\u5668",
        "\u6253\u5f00\u8ba1\u7b97\u6c14",
      ],
      referenceTranscript: "open calculator",
      expectedIntent: "localApp.open",
      expectedSlots: { target: "calculator" },
      repeat: 20,
    },
    {
      raws: [
        "open vs code",
        "Open VS. Code.",
        "open v s code",
        "\u6253\u5f00\u5fae\u7231\u6b7b\u6263\u7684",
      ],
      referenceTranscript: "open vscode",
      expectedIntent: "localApp.open",
      expectedSlots: { target: "vscode" },
      repeat: 20,
    },
    {
      raws: [
        "\u6253\u5f00izytoken\u540e\u53f0",
        "\u6253\u5f00izy token\u540e\u53f0",
        "\u6253\u5f00\u4e00\u53eatoken\u540e\u53f0",
        "\u6253\u5f00\u4e00\u53eatoken",
      ],
      referenceTranscript: "open IZYtoken admin",
      expectedIntent: "browser.open",
      expectedSlots: { target: "IZYtoken admin" },
      repeat: 12,
    },
    {
      raws: [
        "\u8ba9Codex\u68c0\u67e5\u9879\u76ee",
        "\u8ba9\u6263\u7684\u514b\u65af\u68c0\u67e5\u9879\u76ee",
        "\u8ba9\u6263\u7684\u514b\u65af\u68c0\u67e5\u4e00\u4e0b\u9879\u76ee",
        "codex check project",
      ],
      referenceTranscript: "Codex check project",
      expectedIntent: "coding.task",
      expectedSlots: { target: "codex", action: "check_project" },
      repeat: 12,
    },
    {
      raws: ["open github", "\u6253\u5f00github", "\u6253\u5f00git hub"],
      referenceTranscript: "open GitHub",
      expectedIntent: "browser.open",
      expectedSlots: { target: "GitHub" },
      repeat: 12,
    },
  ];
  const records: EvalRecord[] = [];
  for (const group of groups) {
    for (let index = 0; index < group.repeat; index += 1) {
      records.push({
        id: `voice-eval-${records.length + 1}`,
        rawTranscript: group.raws[index % group.raws.length]!,
        referenceTranscript: group.referenceTranscript,
        expectedIntent: group.expectedIntent,
        expectedSlots: group.expectedSlots,
      });
    }
  }
  return records;
}

function characterErrorRate(actual: string, expected: string): number {
  const actualNormalized = normalizeMetricText(actual);
  const expectedNormalized = normalizeMetricText(expected);
  return (
    levenshteinForMetrics(actualNormalized, expectedNormalized) /
    Math.max(expectedNormalized.length, 1)
  );
}

function normalizeMetricText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/gu, "");
}

function levenshteinForMetrics(left: string, right: string): number {
  const rows: number[][] = Array.from({ length: left.length + 1 }, () =>
    Array.from({ length: right.length + 1 }, () => 0),
  );
  for (let row = 0; row <= left.length; row += 1) {
    rows[row]![0] = row;
  }
  for (let column = 0; column <= right.length; column += 1) {
    rows[0]![column] = column;
  }
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row]![column] = Math.min(
        rows[row - 1]![column]! + 1,
        rows[row]![column - 1]! + 1,
        rows[row - 1]![column - 1]! + cost,
      );
    }
  }
  return rows[left.length]![right.length]!;
}

function round(value: number): number {
  return Number(value.toFixed(3));
}
