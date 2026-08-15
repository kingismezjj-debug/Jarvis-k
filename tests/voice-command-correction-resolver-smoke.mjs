import { VoiceCommandResolver } from "../packages/core/dist/voice-command-resolver.js";

const resolver = new VoiceCommandResolver();
const correction = resolver.resolve({
  rawTranscript: "\u6253\u5f00\u5fae\u7231\u6b7b\u6263\u7684",
});
const candidate = correction.correctionCandidates[0];

if (
  correction.requiresUserSelection !== false ||
  candidate?.intent !== "localApp.open" ||
  candidate?.slots?.target !== "vscode"
) {
  throw new Error(`Unexpected resolver-only correction: ${JSON.stringify(correction)}`);
}

console.log(
  JSON.stringify({
    status: "PASS",
    executionLayer: "resolver_only",
    executorCalled: false,
    intent: candidate.intent,
    target: candidate.slots?.target,
  }),
);
