# Stage 3 Heavy Planner Fallback Closeout and Freeze

Recorded on 2026-08-07 after the approved fixture/simulated Stage 3 Heavy
Planner Fallback implementation passed.

## Status

`FROZEN_ALPHA_CLOSED`

The Stage 3 Heavy Planner Fallback scope is closed for the current
developer-alpha fixture/simulated implementation. Jarvis-K now has a
provider-neutral planner contract, a bounded `BrainPlan` shape, a fixture
planner provider, and Core runtime hooks that can escalate complex, fuzzy,
clarify, or low-confidence requests into a plan surface without executing
tools.

This closeout does not claim product readiness. It does not authorize real
GLM, ChatGPT, OpenAI, Anthropic, Volcengine, Qwen-cloud, or other planner API
calls. It does not authorize real credential storage, network access, planner
session persistence, UI/IPC exposure, telemetry, action execution, installer,
update, release-channel, default behavior, or production behavior.

## Closed Scope

The completed Stage 3 surface includes:

- provider-neutral Heavy Planner request/result contracts;
- fixed planner statuses: `planned`, `clarify`, `blocked`, and
  `unavailable`;
- fixed planner selection statuses: `not_needed`, `planned`, `clarify`,
  `fallback`, `blocked`, and `unavailable`;
- fixed reason codes and failure classes for complex request, fuzzy request,
  low-confidence fast-router result, unsupported intent, clarify required,
  provider unavailable, provider failed, invalid plan, unsafe plan, and
  fixture fallback;
- bounded `BrainPlan` and `BrainPlannedToolStep` schemas;
- confirmation requirements for medium, high, and blocked risk plans;
- `directActionAttempted=false` enforced on planner plans, planned tool
  steps, planner results, and planner selection reports;
- sanitized planner selection and result evidence on `BrainCommandResult`;
- secure-key report shape with `credentialExposed=false` and
  `networkAccessApproved=false`;
- `HeavyPlannerProvider` port in `@jarvis-k/capabilities`;
- `FixtureHeavyPlannerProvider`, a no-network/no-credential/no-execution
  fixture provider;
- Core runtime fallback hooks for complex, clarify, and low-confidence
  fast-router cases;
- fallback preservation when the planner is absent, unavailable, invalid,
  unsafe, or throwing; and
- dispatch handling that can return bounded plan, clarify, or blocked status
  without executing tools.

The main implementation surfaces are:

- `packages/contracts/src/protocol.ts`;
- `packages/capabilities/src/ports.ts`;
- `packages/capabilities/src/fixture-heavy-planner-provider.ts`;
- `packages/core/src/runtime.ts`;
- `packages/contracts/test/protocol.test.ts`; and
- `packages/core/test/runtime.test.ts`.

## Evidence Summary

The approved implementation completed with fixture/simulated evidence only.

Verification passed in `C:\Users\Administrator\Documents\Jarvis-k`:

- `npm run build:contracts`;
- `npm run build:capabilities`;
- `npm run build:core`;
- `vitest packages/contracts/test/protocol.test.ts`: `29 passed`;
- `vitest packages/core/test/runtime.test.ts`: `56 passed`;
- `npm run check:sensitive-artifacts`; and
- `npm run check:boundaries`.

The same Stage 3 source and documentation changes were synced to
`E:\Jarvis-K`, where the contracts/capabilities/core builds, focused
contracts/core tests, sensitive-artifact guard, and boundary guard also
passed.

The fixture coverage proves:

- a complex request can produce a bounded plan requiring confirmation;
- clarify results stop before dispatch;
- invalid planner results fall back with sanitized classification;
- unsafe planner results are blocked before execution;
- low-confidence fast-router results can escalate to the fixture planner; and
- browser/local-app execution is not triggered by planner output.

Sanitized evidence retained no raw planner prompts, raw provider responses,
credentials, tokens, endpoints, account metadata, private paths, stack
traces, hidden reasoning, model internals, logits, vectors, benchmarks,
helper diagnostics, or user-private data.

## Freeze Rules

While this scope is frozen, do not:

- call real GLM, ChatGPT, OpenAI, Anthropic, Volcengine, Qwen-cloud, or any
  other planner API under this approval;
- add network access for planner calls;
- store, validate, migrate, read, or expose real planner API keys;
- add keychain integration, environment-secret capture, or credential
  diagnostics beyond the approved sanitized report shape;
- persist planner sessions, transcripts, queues, provider responses, or
  planner memory;
- execute browser, local-app, shell, filesystem, network, Memory write,
  vector write, OCR, voice, or tool actions from planner output;
- let planner output bypass the executor, allowlist, confirmation policy, or
  existing safety gates;
- rerun Qwen runtime/cache as part of planner fallback;
- add Desktop IPC, preload, settings UI, UI panels, telemetry, analytics,
  installer, update, packaging, release-channel, or production behavior;
- enable the planner by default for product traffic;
- broaden fixture tests into real user tasks or broader tester windows; or
- record raw prompts, raw provider responses, credentials, tokens, endpoints,
  URLs, private paths, stack traces, hidden reasoning, model internals,
  vectors, benchmarks, or user-private data.

Any real planner provider composition, secure credential storage, one-window
API acceptance, product-default behavior, UI/IPC exposure, tool execution,
tester expansion, persistent planner state, telemetry, release behavior, or
production-readiness claim requires a fresh exact-scope Product, Security,
and Release approval.

## Product and Release Disposition

Stage 3 is approved only as internal developer-alpha fixture/simulated
evidence. It is not a product default, not a public tester workflow, not a
real cloud planner integration, not a release artifact, and not a production
planning system.

The product decision is to preserve this planner contract as the safe bridge
between the fast local router and a later heavy model. The heavy planner may
recommend bounded plans, but the executor remains the only side-effect actor.
Medium, high, and blocked risk plans require confirmation before any future
execution scope can consider them.

## Next Productization Route

The next route should be opened as a separate approval request. The likely
next scope is real Heavy Planner provider composition and secure credential
storage, still default-off and still no tool execution unless separately
approved.

That next approval should define:

- which provider family is in scope, such as GLM or ChatGPT;
- where credentials may be stored and how diagnostics stay sanitized;
- how provider configuration is reported without exposing raw keys, tokens,
  endpoints, account metadata, or private user data;
- whether the first API acceptance is fixture-only, mocked transport, or a
  one-window real API call;
- the fixed prompt window, token/output bounds, timeout, retry policy, and
  stop conditions;
- how raw provider output is parsed into the existing bounded `BrainPlan`;
- how invalid, unsafe, unavailable, timeout, quota, or credential failures
  fail closed;
- how Qwen/rules fallback remains preserved; and
- how no planner output executes tools until a later executor scope is
  separately approved.

That next scope must not silently enable real API use, broaden tester
windows, persist raw responses, change product defaults, expose UI/IPC,
execute tools, add telemetry, or change release behavior.

## Final Freeze Statement

Stage 3 Heavy Planner Fallback is evidence-complete for the
fixture/simulated developer-alpha scope and is now frozen. Keep the bounded
planner contracts, fixture provider, Core runtime fallback hooks, regression
tests, and sanitized evidence available for regression. Stop here until the
next exact-scope approval explicitly opens real planner provider composition,
secure credential storage, or one-window API acceptance.
