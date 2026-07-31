# Phase 2.6 Project Hardening & Developer Onboarding

Started on 2026-07-30.

## Goal

Turn the completed phase 2 voice baseline into a repository that another
developer can clone, verify, launch, configure safely, and maintain without
needing hidden context from the migration thread.

## Scope

- README refresh for the phase 2 voice baseline
- developer onboarding instructions
- security and credential-handling instructions
- `.env.example` that explicitly avoids storing provider credentials
- GitHub Actions CI for typecheck, tests, dependency boundaries, and build
- keep phase 3 out of scope

## Non-Goals

- no SQLite memory implementation
- no model routing
- no capability execution system
- no wake-word workers
- no new provider beyond the existing Xunfei RTASR adapter

## Exit Gate

- `npm run verify` passes locally
- default CI can run without secrets
- docs explain how to configure voice credentials safely
- docs explain how to diagnose microphone capture quality
- repository remains free of provider credentials and signed URLs

