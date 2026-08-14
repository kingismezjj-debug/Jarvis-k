# GLM Chat Answer Offline Prompt and Output-Bound Strategy

Date: 2026-08-09

## Trigger

The first approved Chat Answer API window reached the fixed three-call limit.
Two benign/ambiguous samples timed out at the fixed 20-second bound; the
unsafe sample returned a valid blocked result. Secure storage, credential
non-exposure, fixed composition gates, and cleanup all passed.

## Offline Change

The runtime now uses the fixed `compact_json_object_128` strategy:

- output budget reduced from 350 to 128 tokens;
- system instruction reduced to only result status, bounded content rules,
  required false safety flags, and no-tool/no-action requirements;
- user payload reduced to the sanitized utterance only;
- ambiguous input is explicitly directed to `clarify`;
- unsafe execution input is explicitly directed to `blocked`;
- timeout increased from 20 to 30 seconds after a successful 13-second
  minimal provider health diagnostic; one attempt and zero retries are
  unchanged.

## Verification Plan

This document records an offline fixture-only adjustment. It does not grant a
new credential, network, API, or acceptance window. A new exact-scope
Product/Security/Release approval is required before any further real GLM
Chat Answer call.
