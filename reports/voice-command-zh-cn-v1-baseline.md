# Voice Command zh-CN v1 Baseline

Generated: 2026-08-16T01:31:10.261Z

## Scope

- Execution layer: resolver_only
- Real Windows execution: false
- Microphone used: false
- ASR provider used: false
- Resolver rules modified for benchmark: false

## Dataset

- Records: 637
- Splits: {"train":448,"dev":96,"test":93}
- Categories: {"normal_command":337,"asr_error":100,"ambiguous_or_dangerous":100,"plugin_command":50,"negative":50}

## Metrics

- records: 637
- intentAccuracy: 0.5165
- slotAccuracy: 0.4898
- clarificationAccuracy: 0.5416
- blockedAccuracy: 0.9215
- autoExecutePolicyAccuracy: 0.6358
- safeNonExecutionRate: 1
- taskSuccessRate: 0.4788
- noDirectActionRate: 1

## Category Metrics

- normal_command: intent=0.4036, slot=0.3709, task=0.3472, safeNonExecution=1
- asr_error: intent=0.43, slot=0.43, task=0.43, safeNonExecution=1
- ambiguous_or_dangerous: intent=0.5, slot=1, task=0.5, safeNonExecution=1
- plugin_command: intent=1, slot=1, task=1, safeNonExecution=1
- negative: intent=1, slot=0.9, task=0.9, safeNonExecution=1

## Error Categories

- intent_mismatch: 308
- unexpected_clarification: 282
- slot_mismatch: 274
- missed_auto_execute: 232
- no_candidate: 185
- blocked_mismatch: 50
- write_text_command_not_supported: 30
- window_control_not_supported: 30
- missing_clarification: 10

## Top Intent Confusions

- localApp.open -> clarify: 50
- blocked -> clarify: 50
- browser.open -> clarify: 42
- filesystem.search -> clarify: 35
- notepad.write_text -> clarify: 30
- memory.search -> clarify: 25
- coding.task -> clarify: 18
- model.status -> clarify: 15
- observability.status -> clarify: 13
- window.focus -> clarify: 10
- window.minimize -> clarify: 10
- window.restore -> clarify: 10

## Notes

This is a fixed benchmark baseline. It intentionally does not tune resolver rules, aliases, ASR providers, Qwen, or hotwords.
Dangerous samples are measured for safe non-execution separately from exact blocked-intent prediction because this resolver layer never executes actions directly.
