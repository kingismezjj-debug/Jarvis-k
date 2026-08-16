# Voice Command zh-CN v1 Baseline

Generated: 2026-08-16T01:56:33.129Z
Git commit: 350d182690cbe2fd704136918ee4291bc73c4319
Dataset digest: f8fac54bc046cc48c4f422ca541f7f9c829558a1db125bc8094a6092d23d2450
Evaluator version: 2

## Scope

- Execution layer: resolver_only
- Real Windows execution: false
- Microphone used: false
- ASR provider used: false
- Qwen used: false
- Product executor used: false
- Resolver rules modified for benchmark: false

## Dataset

- Selected split: all
- Evaluated records: 637
- Total records: 637
- Splits: {"train":448,"dev":96,"test":93}
- Categories: {"normal_command":337,"asr_error":100,"ambiguous_or_dangerous":100,"plugin_command":50,"negative":50}
- Modes: {"command":587,"dictation":15,"conversation":35}
- Provenance: {"synthetic_curated":337,"synthetic_asr_error":100,"synthetic_safety_case":100,"synthetic_plugin_command":50,"synthetic_negative":50}

## Split Policy

- train: development-visible examples for rule work.
- dev: comparison split for threshold and rule selection.
- test: locked final evaluation split; Phase 2 daily optimization should not inspect per-sample test errors.
- validation naming is represented by dev to keep the public split vocabulary short.
- test changes require a benchmark version bump or a documented audit repair with the previous digest preserved.

## Metric Definitions

- intentAccuracy: Predicted resolver-layer intent equals expected intent.
- slotExactMatchAllSamples: Strict normalized expected slots equal predicted slots for every sample; extra slots fail.
- slotExactMatchGivenCorrectIntent: Strict slot exact match over samples whose intent is correct; denominator zero returns not_available.
- jointIntentSlotsAccuracy: Intent accuracy and slot exact match both true.
- taskSuccessRate: Resolver-only exact success: intent, slots, clarification, block, and auto-execution eligibility all match expected.
- top1CandidateAccuracy: First resolver candidate matches expected by candidate id or intent+slots. Clarification text is not a candidate.
- top2CandidateRecall: Any of the first two resolver candidates matches expected by candidate id or intent+slots.
- autoExecutionEligibilityAccuracy: Resolver candidate eligibility matches expected autoExecuteAllowed. This is not product execution.
- safeNonExecutionRate: Risky samples are not marked eligible for auto execution by resolver-layer policy.
- noDirectActionRate: Resolver invariant: directActionAttempted is false. It is not an auto-execution success metric.

## Metrics

- records: 637
- intentAccuracy: 0.5165
- slotExactMatchAllSamples: 0.5699
- slotExactMatchGivenCorrectIntent: 0.9514
- jointIntentSlotsAccuracy: 0.4914
- taskSuccessRate: 0.4788
- top1CandidateAccuracy: 0.3658
- top2CandidateRecall: 0.4144
- clarificationPrecision: 0.2123
- clarificationRecall: 0.8837
- clarificationF1: 0.3424
- unexpectedClarification: 282
- missedClarification: 10
- blockPrecision: not_available
- blockRecall: 0
- blockF1: not_available
- falseBlock: 0
- missedBlock: 50
- autoExecutionEligibilityAccuracy: 0.6358
- dangerousFalseEligibilityRate: 0
- negativeFalseEligibilityRate: 0
- safeCommandMissedEligibilityRate: 0.5144
- safeNonExecutionRate: 1
- noDirectActionRate: 1
- dictationToCommandErrorRate: 0
- conversationToExecutableCommandErrorRate: 0
- commandToConversationErrorRate: 0

## Top-k

- withCandidate: 402
- withoutCandidate: 235
- singleCandidate: 263
- multipleCandidates: 139
- top1CandidateAccuracy: 0.3658
- top2CandidateRecall: 0.4144
- averageCandidateCount: 0.8493

## Performance

- nodeVersion: v24.15.0
- platform: Windows_NT 10.0.19045 x64
- recordsPerRun: 637
- warmupRuns: 2
- performanceRuns: 3
- coldStartMs: 469.7604
- warmAverageMs: 0.7191
- p50Ms: 0.6897
- p95Ms: 1.2888
- p99Ms: 1.5649
- maxMs: 2.4275
- throughputPerSecond: 1390.1932
- runTotalMs: [459.3644,454.547,460.7177]

## Split Metrics

- train: intent=0.5223, joint=0.4933, task=0.4799, eligibility=0.6473
- dev: intent=0.5104, joint=0.5, task=0.5, eligibility=0.6042
- test: intent=0.4946, joint=0.4731, task=0.4516, eligibility=0.6129

## Category Metrics

- normal_command: intent=0.4036, joint=0.3709, task=0.3472, eligibility=0.4807
- asr_error: intent=0.43, joint=0.43, task=0.43, eligibility=0.43
- ambiguous_or_dangerous: intent=0.5, joint=0.5, task=0.5, eligibility=1
- plugin_command: intent=1, joint=1, task=1, eligibility=1
- negative: intent=1, joint=0.9, task=0.9, eligibility=1

## Mode Metrics

- command: intent=0.4753, joint=0.4566, task=0.4429, eligibility=0.6048
- dictation: intent=1, joint=0.6667, task=0.6667, eligibility=1
- conversation: intent=1, joint=1, task=1, eligibility=1

## Risk Metrics

- low_auto_eligible: intent=0.4856, joint=0.4656, task=0.4656, eligibility=0.4856
- ambiguous: intent=0.6977, joint=0.6744, task=0.5814, eligibility=1
- dangerous: intent=0, joint=0, task=0, eligibility=1
- low_not_auto: intent=1, joint=0.9, task=0.9, eligibility=1

## Error Top 10

- intent_mismatch: 308
- unexpected_clarification: 282
- slot_mismatch: 274
- missed_eligibility: 232
- safe_command_missed_eligibility: 232
- no_candidate: 185
- missed_block: 50
- write_text_command_not_supported: 30
- window_control_not_supported: 30
- missed_clarification: 10

## Audit

- Duplicate raw transcripts: 0
- Duplicate raw+context: 0
- Duplicate normalized transcripts: 45
- Similar pairs >= 0.90: 128
- Cross-split similar pairs: 60
- Unique derived group IDs: 559
- Max group size: 4
- Cross-split derived groups: 31
- Template-like groups: 0
- Privacy hits: 0
- Suspicious label samples: 0
- Suspicious sample IDs: none

## Limitations

- This benchmark uses text transcripts only; it contains no real ASR audio.
- It does not call Qwen, ASR providers, microphones, Windows Executor, or product runtime execution.
- safeNonExecutionRate means risky samples were not marked resolver-eligible for auto execution; it is not inferred from the absence of an executor.
- noDirectActionRate is an invariant for this resolver layer and should remain 1.
