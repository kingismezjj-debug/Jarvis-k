# voice-command-zh-cn-v1.1 Baseline

Generated: 2026-08-16T04:34:02.231Z
Git commit: 5dd96af6c6f2610959b66b08d1221e101f5fa810
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

- Selected split: train
- Evaluated records: 413
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

- records: 413
- intentAccuracy: 0.7893
- slotExactMatchAllSamples: 0.8063
- slotExactMatchGivenCorrectIntent: 0.9601
- jointIntentSlotsAccuracy: 0.7579
- taskSuccessRate: 0.6029
- top1CandidateAccuracy: 0.7119
- top2CandidateRecall: 0.724
- legacyAllSampleTop1CandidateAccuracy: 0.7119
- legacyAllSampleTop2CandidateRecall: 0.724
- candidateRequiredTop1Accuracy: 0.9609
- candidateRequiredTop2Recall: 0.9609
- qwenEligibleTop1Accuracy: 0.9787
- qwenEligibleTop2Recall: 0.9787
- nonCandidateOutcomeAccuracy: 0.5287
- clarificationPrecision: 0.4947
- clarificationRecall: 0.6184
- clarificationF1: 0.5497
- unexpectedClarification: 48
- missedClarification: 29
- blockPrecision: 1
- blockRecall: 0.5556
- blockF1: 0.7143
- falseBlock: 0
- missedBlock: 20
- autoExecutionEligibilityAccuracy: 0.7966
- dangerousFalseEligibilityRate: 0
- negativeFalseEligibilityRate: 0
- safeCommandMissedEligibilityRate: 0.3281
- safeNonExecutionRate: 1
- noDirectActionRate: 1
- dictationToCommandErrorRate: 0
- conversationToExecutableCommandErrorRate: 0
- commandToConversationErrorRate: 0

## Top-k

- withCandidate: 325
- withoutCandidate: 88
- singleCandidate: 294
- multipleCandidates: 31
- legacyAllSampleTop1CandidateAccuracy: 0.7119
- legacyAllSampleTop2CandidateRecall: 0.724
- top1CandidateAccuracy: 0.7119
- top2CandidateRecall: 0.724
- averageCandidateCount: 0.862

## Candidate-required Metrics

- records: 256
- candidatePresenceRate: 0.9844
- top1CandidateAccuracy: 0.9609
- top2CandidateRecall: 0.9609
- top3CandidateRecall: 0.9609
- top5CandidateRecall: 0.9609
- noCandidateRate: 0.0156
- missingCandidateRate: 0.0156
- averageCandidateCount: 1.0859
- expectedInTopKButNotTop1: 0
- rankingGapRate: 0
- theoreticalMaxRerankGain: 0
- failureClasses: {"expected_at_rank_1":222,"candidate_correct_but_slot_incorrect":6,"candidate_correct_but_policy_requires_clarification":24,"no_candidates_returned":4}

## Qwen Rerank-eligible Metrics

- records: 188
- candidatePresenceRate: 0.9787
- top1CandidateAccuracy: 0.9787
- top2CandidateRecall: 0.9787
- top3CandidateRecall: 0.9787
- top5CandidateRecall: 0.9787
- noCandidateRate: 0.0213
- missingCandidateRate: 0.0213
- averageCandidateCount: 1.0957
- expectedInTopKButNotTop1: 0
- rankingGapRate: 0
- theoreticalMaxRerankGain: 0
- failureClasses: {"expected_at_rank_1":163,"no_candidates_returned":4,"candidate_correct_but_policy_requires_clarification":21}

## Outcome Classes

- candidate_required: intent=0.8906, joint=0.8672, task=0.6484, eligibility=0.6719
- clarification_expected: intent=0.4868, joint=0.4211, task=0.3158, eligibility=1
- blocked_expected: intent=0.5556, joint=0.5556, task=0.5556, eligibility=1
- direct_non_action_decision: intent=1, joint=0.9444, task=0.9444, eligibility=1

## Candidate Failure Classes

- expected_at_rank_1: 222
- not_applicable: 157
- candidate_correct_but_slot_incorrect: 6
- candidate_correct_but_policy_requires_clarification: 24
- no_candidates_returned: 4

## Candidate Sources

- voice_alias: 34
- pinyin_similarity: 24
- english_normalization: 12
- none: 88
- grammar: 181
- slot_grammar: 32
- plugin_capability: 42

## Performance

- nodeVersion: v24.15.0
- platform: Windows_NT 10.0.19045 x64
- recordsPerRun: 413
- warmupRuns: 2
- performanceRuns: 3
- coldStartMs: 250.1231
- warmAverageMs: 0.6202
- p50Ms: 0.6555
- p95Ms: 1.2363
- p99Ms: 1.7113
- maxMs: 2.4936
- throughputPerSecond: 1611.383
- runTotalMs: [261.5424,256.419,250.9433]

## Split Metrics

- train: intent=0.7893, joint=0.7579, task=0.6029, eligibility=0.7966

## Category Metrics

- normal_command: intent=0.875, joint=0.8221, task=0.5144, eligibility=0.7163
- asr_error: intent=0.7381, joint=0.7381, task=0.7381, eligibility=0.7381
- ambiguous_or_dangerous: intent=0.5765, joint=0.5765, task=0.5765, eligibility=1
- plugin_command: intent=0.6667, joint=0.6667, task=0.6667, eligibility=0.6667
- negative: intent=1, joint=0.9444, task=0.9444, eligibility=1

## Mode Metrics

- command: intent=0.7692, joint=0.7401, task=0.5703, eligibility=0.7772
- dictation: intent=1, joint=0.6667, task=0.6667, eligibility=1
- conversation: intent=1, joint=1, task=1, eligibility=1

## Risk Metrics

- low_auto_eligible: intent=0.8906, joint=0.8672, task=0.6484, eligibility=0.6719
- ambiguous: intent=0.4868, joint=0.4211, task=0.3158, eligibility=1
- dangerous: intent=0.5556, joint=0.5556, task=0.5556, eligibility=1
- low_not_auto: intent=1, joint=0.9444, task=0.9444, eligibility=1

## Error Top 10

- intent_mismatch: 87
- missed_eligibility: 84
- safe_command_missed_eligibility: 84
- slot_mismatch: 80
- no_candidate: 52
- unexpected_clarification: 48
- missed_clarification: 29
- missed_block: 20
- plugin_not_resolved: 14

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
