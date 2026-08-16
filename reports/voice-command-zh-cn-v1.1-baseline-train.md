# voice-command-zh-cn-v1.1 Baseline

Generated: 2026-08-16T03:47:06.793Z
Git commit: 645ee9fce9dcea6c482cbd4082fabf2c4cbf6b25
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
- intentAccuracy: 0.7385
- slotExactMatchAllSamples: 0.7554
- slotExactMatchGivenCorrectIntent: 0.9574
- jointIntentSlotsAccuracy: 0.707
- taskSuccessRate: 0.586
- top1CandidateAccuracy: 0.6683
- top2CandidateRecall: 0.6804
- legacyAllSampleTop1CandidateAccuracy: 0.6683
- legacyAllSampleTop2CandidateRecall: 0.6804
- candidateRequiredTop1Accuracy: 0.8906
- candidateRequiredTop2Recall: 0.8906
- qwenEligibleTop1Accuracy: 0.883
- qwenEligibleTop2Recall: 0.883
- nonCandidateOutcomeAccuracy: 0.5287
- clarificationPrecision: 0.4052
- clarificationRecall: 0.6184
- clarificationF1: 0.4896
- unexpectedClarification: 69
- missedClarification: 29
- blockPrecision: 1
- blockRecall: 0.5556
- blockF1: 0.7143
- falseBlock: 0
- missedBlock: 20
- autoExecutionEligibilityAccuracy: 0.7797
- dangerousFalseEligibilityRate: 0
- negativeFalseEligibilityRate: 0
- safeCommandMissedEligibilityRate: 0.3555
- safeNonExecutionRate: 1
- noDirectActionRate: 1
- dictationToCommandErrorRate: 0
- conversationToExecutableCommandErrorRate: 0
- commandToConversationErrorRate: 0

## Top-k

- withCandidate: 307
- withoutCandidate: 106
- singleCandidate: 276
- multipleCandidates: 31
- legacyAllSampleTop1CandidateAccuracy: 0.6683
- legacyAllSampleTop2CandidateRecall: 0.6804
- top1CandidateAccuracy: 0.6683
- top2CandidateRecall: 0.6804
- averageCandidateCount: 0.8184

## Candidate-required Metrics

- records: 256
- candidatePresenceRate: 0.9141
- top1CandidateAccuracy: 0.8906
- top2CandidateRecall: 0.8906
- top3CandidateRecall: 0.8906
- top5CandidateRecall: 0.8906
- noCandidateRate: 0.0859
- missingCandidateRate: 0.0859
- averageCandidateCount: 1.0156
- expectedInTopKButNotTop1: 0
- rankingGapRate: 0
- theoreticalMaxRerankGain: 0
- failureClasses: {"expected_at_rank_1":201,"candidate_correct_but_policy_requires_clarification":27,"no_candidates_returned":22,"candidate_correct_but_slot_incorrect":6}

## Qwen Rerank-eligible Metrics

- records: 188
- candidatePresenceRate: 0.883
- top1CandidateAccuracy: 0.883
- top2CandidateRecall: 0.883
- top3CandidateRecall: 0.883
- top5CandidateRecall: 0.883
- noCandidateRate: 0.117
- missingCandidateRate: 0.117
- averageCandidateCount: 1
- expectedInTopKButNotTop1: 0
- rankingGapRate: 0
- theoreticalMaxRerankGain: 0
- failureClasses: {"expected_at_rank_1":142,"candidate_correct_but_policy_requires_clarification":24,"no_candidates_returned":22}

## Outcome Classes

- candidate_required: intent=0.8086, joint=0.7852, task=0.6211, eligibility=0.6445
- clarification_expected: intent=0.4868, joint=0.4211, task=0.3158, eligibility=1
- blocked_expected: intent=0.5556, joint=0.5556, task=0.5556, eligibility=1
- direct_non_action_decision: intent=1, joint=0.9444, task=0.9444, eligibility=1

## Candidate Failure Classes

- expected_at_rank_1: 201
- not_applicable: 157
- candidate_correct_but_policy_requires_clarification: 27
- no_candidates_returned: 22
- candidate_correct_but_slot_incorrect: 6

## Candidate Sources

- voice_alias: 34
- pinyin_similarity: 23
- english_normalization: 12
- none: 106
- grammar: 161
- slot_grammar: 35
- plugin_capability: 42

## Performance

- nodeVersion: v24.15.0
- platform: Windows_NT 10.0.19045 x64
- recordsPerRun: 413
- warmupRuns: 2
- performanceRuns: 3
- coldStartMs: 311.6618
- warmAverageMs: 0.7534
- p50Ms: 0.7292
- p95Ms: 1.5812
- p99Ms: 2.242
- maxMs: 3.4357
- throughputPerSecond: 1326.5839
- runTotalMs: [319.8633,312.6545,301.4601]

## Split Metrics

- train: intent=0.7385, joint=0.707, task=0.586, eligibility=0.7797

## Category Metrics

- normal_command: intent=0.774, joint=0.7212, task=0.4808, eligibility=0.6827
- asr_error: intent=0.7381, joint=0.7381, task=0.7381, eligibility=0.7381
- ambiguous_or_dangerous: intent=0.5765, joint=0.5765, task=0.5765, eligibility=1
- plugin_command: intent=0.6667, joint=0.6667, task=0.6667, eligibility=0.6667
- negative: intent=1, joint=0.9444, task=0.9444, eligibility=1

## Mode Metrics

- command: intent=0.7135, joint=0.6844, task=0.5517, eligibility=0.7586
- dictation: intent=1, joint=0.6667, task=0.6667, eligibility=1
- conversation: intent=1, joint=1, task=1, eligibility=1

## Risk Metrics

- low_auto_eligible: intent=0.8086, joint=0.7852, task=0.6211, eligibility=0.6445
- ambiguous: intent=0.4868, joint=0.4211, task=0.3158, eligibility=1
- dangerous: intent=0.5556, joint=0.5556, task=0.5556, eligibility=1
- low_not_auto: intent=1, joint=0.9444, task=0.9444, eligibility=1

## Error Top 10

- intent_mismatch: 108
- slot_mismatch: 101
- missed_eligibility: 91
- safe_command_missed_eligibility: 91
- no_candidate: 70
- unexpected_clarification: 69
- missed_clarification: 29
- missed_block: 20
- write_text_command_not_supported: 14
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
