# Documentation scope

[CURRENT_STATUS.md](../CURRENT_STATUS.md) is the only current product summary.
Source code and package scripts define implementation; evidence describes only its
recorded commit, artifact, environment and observation provenance.

All dated phase/progress/completion/closeout/acceptance/approval documents in this
directory are milestone records, including phrases such as “current”, “complete”,
“next” and “PASS” inside them. They do not override the current summary. Operational
guides describe procedures, not an assertion that optional features are enabled.
The development master plan remains the architectural/product constraint; it is
not a completion ledger or an instruction to restart an old milestone.

## UI-3L-0 reconciliation map

| Conflicting entry point | Treatment |
| --- | --- |
| CURRENT_STATUS old unsigned/no-certificate/Alpha.1 failure vs later signed Alpha.7 records | Whole old file preserved verbatim as a historical snapshot; current summary identifies signed historical evidence and unsigned/unpackaged latest source separately |
| CURRENT_STATUS “crash recovery out of scope” vs implemented recovery journal | Current recovery explicitly UI-3K-2E L3, real pending-approval crash B incomplete |
| README old Phase 5/7/8 baseline and “ready for next phase” | Old introductory/status ledger preserved verbatim; README now links to the sole current summary |
| Old architecture and August product roadmap “current next task” | Explicit historical banner; no instruction to recreate Task Runtime or resume old approval ladders |
| UI modernization roadmap default Legacy vs later V2 development/Alpha rollout | Historical planning banner; effective mount state belongs to current summary/source |
| Existing rules/Planner/Windows executor L4 vs bounded Assistant tools | Separate surfaces in current capability matrix; no inferred Assistant filesystem/browser capability |
| Plugin sample L4 vs third-party platform availability | Sample/SDK evidence retained; third-party install/runtime and marketplace are not promoted |
| Signed Alpha.7 version vs newer commits with same metadata | Require commit plus artifact hash; historical signing is not current-source signing |
| Historical tests PASS vs ARM clean verify missing Desktop dist | Preserve both results with environment/order distinction; UI-3L-0 fixes ordering rather than relabeling old failure |

Historical evidence and recovery profiles are not deleted. The two archived ledgers
retain the original source text, including superseded contradictions, under a clear
historical heading. They must not be consumed as current status.

Current operational entry: [Developer Onboarding](developer-onboarding.md).
