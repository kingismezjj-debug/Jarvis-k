# voice-command-zh-cn-v1.1 Baseline

Generated: 2026-08-16T04:37:53.782Z
Git commit: 6017e029490c4a00d874c7fbbbfc367f9a32385f
Dataset digest: 6be5c0b2f5d371049fc609f4205f316bcff2a19910f966f56fb94e3b38fbc059
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

- Selected split: dev
- Evaluated records: 96
- Total records: 637
- Splits: {"train":413,"test":128,"dev":96}
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
- top2CandidateRecall: Legacy all-sample metric: any of the first two resolver candidates matches expected by candidate id or intent+slots.
- legacyAllSampleTop1CandidateAccuracy: Historical all-sample Top-1 candidate metric. Non-candidate outcomes remain in the denominator for historical comparison only.
- legacyAllSampleTop2CandidateRecall: Historical all-sample Top-2 candidate metric. Do not use for Qwen rerank admission.
- candidateRequired: Candidate metrics over samples whose expected outcome contract requires a resolver candidate.
- qwenRerankEligible: Candidate metrics over candidate-required samples whose intent may be reranked by future Qwen over a bounded candidate set.
- outcomeClass: Expected outcome class derived from expected intent, blocked/clarification flags, mode, and product safety semantics; never from resolver output.
- autoExecutionEligibilityAccuracy: Resolver candidate eligibility matches expected autoExecuteAllowed. This is not product execution.
- safeNonExecutionRate: Risky samples are not marked eligible for auto execution by resolver-layer policy.
- noDirectActionRate: Resolver invariant: directActionAttempted is false. It is not an auto-execution success metric.

## Metrics

- records: 96
- intentAccuracy: 1
- slotExactMatchAllSamples: 1
- slotExactMatchGivenCorrectIntent: 1
- jointIntentSlotsAccuracy: 1
- taskSuccessRate: 0.9583
- top1CandidateAccuracy: 1
- top2CandidateRecall: 1
- legacyAllSampleTop1CandidateAccuracy: 1
- legacyAllSampleTop2CandidateRecall: 1
- candidateRequiredTop1Accuracy: 1
- candidateRequiredTop2Recall: 1
- qwenEligibleTop1Accuracy: 1
- qwenEligibleTop2Recall: 1
- nonCandidateOutcomeAccuracy: not_available
- clarificationPrecision: not_available
- clarificationRecall: not_available
- clarificationF1: not_available
- unexpectedClarification: 0
- missedClarification: 0
- blockPrecision: not_available
- blockRecall: not_available
- blockF1: not_available
- falseBlock: 0
- missedBlock: 0
- autoExecutionEligibilityAccuracy: 0.9583
- dangerousFalseEligibilityRate: not_available
- negativeFalseEligibilityRate: not_available
- safeCommandMissedEligibilityRate: 0.0417
- safeNonExecutionRate: not_available
- noDirectActionRate: 1
- dictationToCommandErrorRate: not_available
- conversationToExecutableCommandErrorRate: not_available
- commandToConversationErrorRate: 0

## Top-k

- withCandidate: 96
- withoutCandidate: 0
- singleCandidate: 96
- multipleCandidates: 0
- legacyAllSampleTop1CandidateAccuracy: 1
- legacyAllSampleTop2CandidateRecall: 1
- top1CandidateAccuracy: 1
- top2CandidateRecall: 1
- averageCandidateCount: 1

## Candidate-required Metrics

- records: 96
- candidatePresenceRate: 1
- top1CandidateAccuracy: 1
- top2CandidateRecall: 1
- top3CandidateRecall: 1
- top5CandidateRecall: 1
- noCandidateRate: 0
- missingCandidateRate: 0
- averageCandidateCount: 1
- expectedInTopKButNotTop1: 0
- rankingGapRate: 0
- theoreticalMaxRerankGain: 0
- failureClasses: {"expected_at_rank_1":96}

## Qwen Rerank-eligible Metrics

- records: 96
- candidatePresenceRate: 1
- top1CandidateAccuracy: 1
- top2CandidateRecall: 1
- top3CandidateRecall: 1
- top5CandidateRecall: 1
- noCandidateRate: 0
- missingCandidateRate: 0
- averageCandidateCount: 1
- expectedInTopKButNotTop1: 0
- rankingGapRate: 0
- theoreticalMaxRerankGain: 0
- failureClasses: {"expected_at_rank_1":96}

## Outcome Classes

- candidate_required: intent=1, joint=1, task=0.9583, eligibility=0.9583

## Candidate Failure Classes

- expected_at_rank_1: 96

## Candidate Sources

- voice_alias: 29
- grammar: 56
- user_route_alias: 2
- english_normalization: 9

## Performance

- nodeVersion: v24.15.0
- platform: Windows_NT 10.0.19045 x64
- recordsPerRun: 96
- warmupRuns: 2
- performanceRuns: 3
- coldStartMs: 113.682
- warmAverageMs: 1.1408
- p50Ms: 1.2209
- p95Ms: 1.8812
- p99Ms: 2.091
- maxMs: 2.2138
- throughputPerSecond: 876.1794
- runTotalMs: [111.9149,109.4375,107.3474]

## Split Metrics

- dev: intent=1, joint=1, task=0.9583, eligibility=0.9583

## Category Metrics

- normal_command: intent=1, joint=1, task=0.9429, eligibility=0.9429
- asr_error: intent=1, joint=1, task=1, eligibility=1

## Mode Metrics

- command: intent=1, joint=1, task=0.9583, eligibility=0.9583

## Risk Metrics

- low_auto_eligible: intent=1, joint=1, task=0.9583, eligibility=0.9583

## Error Top 10

- missed_eligibility: 4
- safe_command_missed_eligibility: 4

## Audit

- Duplicate raw transcripts: 0
- Duplicate raw+context: 0
- Duplicate normalized transcripts: 45
- Similar pairs >= 0.90: 128
- Cross-split similar pairs: 0
- Unique derived group IDs: 559
- Max group size: 4
- Cross-split derived groups: 4
- Template-like groups: 0
- Privacy hits: 0
- Suspicious label samples: 0
- Suspicious sample IDs: none

## Limitations

- This benchmark uses text transcripts only; it contains no real ASR audio.
- It does not call Qwen, ASR providers, microphones, Windows Executor, or product runtime execution.
- safeNonExecutionRate means risky samples were not marked resolver-eligible for auto execution; it is not inferred from the absence of an executor.
- noDirectActionRate is an invariant for this resolver layer and should remain 1.
