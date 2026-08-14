# GLM Provider/Model/Origin Strategy Analysis

Recorded: 2026-08-07

## Status

`STRATEGY_RECOMMENDED_NO_RUNTIME_AUTHORIZED`

This document redirects GLM work away from repeated runtime reruns and toward
provider/model/origin strategy adjustment. It uses only sanitized Jarvis-K
evidence, local source inspection, and public provider documentation. It does
not authorize credential configuration, network/API calls, runtime tests,
provider expansion, default changes, UI/IPC changes, telemetry, packaging, or
release behavior.

## Current Jarvis-K Evidence

Jarvis-K currently fixes the GLM runtime provider to:

- provider id: `heavy-planner.glm`;
- model id: `glm-4.7`;
- origin: `https://open.bigmodel.cn/api/coding/paas/v4`;
- endpoint:
  `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`;
- non-streaming JSON object mode;
- no tools, no functions, no direct action execution.

Real evidence so far:

- fourth Heavy Planner diagnostic: `3/3` provider calls timed out at `45000ms`;
- first minimal health diagnostic: blocked preflight, no credential configured,
  `requestCount=0`, `networkAttempted=false`;
- second minimal health diagnostic: reached network once, timed out at
  `20007ms`, `requestCount=1`, `networkAttempted=true`,
  `credentialCleared=true`;
- no HTTP authentication, rate-limit, model-unavailable, or provider-unavailable
  category was observed because the successful health attempt timed out before
  response classification.

Conclusion from evidence:

- GLM credential storage and cleanup worked in the second health window;
- timeout is present even for the smallest approved non-planning health prompt;
- continuing Heavy Planner acceptance on the same fixed origin/model is not a
  good next move.

## Public Documentation Check

The public BigModel/Zhipu Chat Completions documentation shows the standard
endpoint as:

`https://open.bigmodel.cn/api/paas/v4/chat/completions`

It also lists `glm-5.2`, `glm-5.1`, `glm-5-turbo`, `glm-5`, `glm-4.7`,
`glm-4.7-flash`, `glm-4.7-flashx`, and other models as available options for
the Chat Completions API, and documents JSON-object response format support.

Source:

- https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8

Important inference:

- the current Jarvis-K origin contains `/api/coding/paas/v4`, while the public
  Chat Completions documentation uses `/api/paas/v4`;
- this origin difference is more important to resolve than changing model
  alone;
- the existing timeout evidence may reflect an origin/profile mismatch,
  coding-plan endpoint behavior, or endpoint reachability, not necessarily
  `glm-4.7` model latency.

## Strategy Decision

Do not run GLM Heavy Planner acceptance again on the current fixed
`api/coding/paas/v4` origin.

Instead, split the next work into three fixture-only steps before any further
real GLM/API window:

1. Origin profile separation:
   define explicit profiles for `standard_paas_v4` and current
   `coding_paas_v4`, with standard Open Platform Chat Completions as the next
   candidate.
2. Model candidate registry:
   keep `glm-4.7` as the current evidence baseline, add fixture-only candidate
   metadata for low-latency models such as `glm-4.7-flash` or
   `glm-4.7-flashx`, and keep `glm-5-turbo` / `glm-5.2` as later quality
   candidates only.
3. Request profile hardening:
   preserve non-streaming JSON object mode, `64` health tokens, no tools, no
   functions, no direct action, and consider deterministic sampling flags such
   as `do_sample=false` in a separately approved fixture-only profile.

## Recommended Candidate Order

### Candidate A: Standard Origin / Same Model

- origin: `https://open.bigmodel.cn/api/paas/v4`;
- endpoint: `/chat/completions`;
- model: `glm-4.7`;
- purpose: isolate whether the previous timeout was caused by the current
  `/api/coding/paas/v4` origin rather than by the model.

This is the highest-value next candidate because it changes only origin while
preserving the previous model.

### Candidate B: Standard Origin / Flash Model

- origin: `https://open.bigmodel.cn/api/paas/v4`;
- endpoint: `/chat/completions`;
- model: `glm-4.7-flash` or `glm-4.7-flashx`;
- purpose: test a likely lower-latency GLM family option after standard origin
  is isolated.

This should not be mixed into Candidate A. If A fails, B needs its own exact
runtime approval.

### Candidate C: Standard Origin / GLM-5 Family

- origin: `https://open.bigmodel.cn/api/paas/v4`;
- endpoint: `/chat/completions`;
- model: `glm-5-turbo` or `glm-5.2`;
- purpose: later quality/planning candidate, not the immediate latency probe.

Do not start here. First prove the standard origin is reachable with a minimal
health request.

## Next Implementation Scope

The next implementation should be fixture-only:

- add a provider profile registry or strategy selector;
- keep current runtime defaults unchanged;
- expose sanitized profile metadata only;
- add tests that prove:
  - current `coding_paas_v4` profile remains recorded as prior evidence;
  - `standard_paas_v4` resolves to the documented
    `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
  - candidate models are fixed strings, not user-supplied;
  - no runtime network, secure store, credential, UI/IPC, telemetry, or release
    behavior is touched;
  - health diagnostic can be constructed against a profile in fixture only.

After that fixture-only work passes, request a new exact runtime approval for
Candidate A only.

## Product Implication

Jarvis-K should keep the product spine moving through Qwen/rules fallback and
Stage 5 Product Alpha Hardening. GLM should remain a default-off diagnostic
candidate until a provider/model/origin profile can pass a minimal health
window and then a separate Heavy Planner acceptance window.
