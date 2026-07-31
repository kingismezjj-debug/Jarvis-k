# Phase 4 Model Candidate Audit

Information checked on 2026-07-31. This document is an engineering audit note,
not legal advice.

## Current Rule

Model candidates are not installable manifests. They remain
`downloadEnabled: false` until Jarvis-K has:

- an exact upstream revision or internal CDN object version,
- SHA-256 for every downloaded artifact,
- dependency license review for runtime, tokenizer, native libraries, and
  helper binaries,
- redistribution approval for closed-source commercial clients,
- benchmark data for Lite, Standard, Local Enhanced, and Private Offline modes.

## Seeded Candidates

| Candidate | Capability | Current Risk | Reason |
| --- | --- | --- | --- |
| `openai/whisper-large-v3-turbo` | STT | Yellow | Strong STT candidate, but converted artifacts, faster-whisper/CTranslate2 runtime packaging, and exact artifact pins still need review. |
| `PaddlePaddle/PaddleOCR` | OCR | Yellow | Image OCR is promising; PDF parsing must stay split until PyMuPDF/AGPL exposure is removed or commercially licensed. |
| `Qwen/Qwen3-Embedding-0.6B` | Embedding | Yellow | Good bilingual retrieval candidate; exact revision, tokenizer, runtime packaging, and benchmark data are still pending. |
| `Qwen/Qwen3-0.6B` | Intent router | Yellow | Possible rules-first router helper; must never execute arbitrary shell output and still needs strict schema/eval work. |

## Evidence Links

- `openai/whisper-large-v3-turbo`:
  https://huggingface.co/openai/whisper-large-v3-turbo
- `faster-whisper`:
  https://github.com/SYSTRAN/faster-whisper
- `CTranslate2`:
  https://github.com/OpenNMT/CTranslate2
- `PaddleOCR`:
  https://github.com/PaddlePaddle/PaddleOCR
- `PaddleOCR LICENSE`:
  https://github.com/PaddlePaddle/PaddleOCR/blob/main/LICENSE
- `PyMuPDF / Artifex licensing`:
  https://artifex.com/licensing
- `Qwen3 Embedding 0.6B`:
  https://huggingface.co/Qwen/Qwen3-Embedding-0.6B
- `Qwen3 0.6B`:
  https://huggingface.co/Qwen/Qwen3-0.6B

## Blockers Before Enabling Download

- Do not use floating Hugging Face `main` references.
- Do not install Python runtimes or native inference libraries in the main app
  without a packaging plan.
- Do not mirror artifacts to a Jarvis CDN until redistribution rights are
  confirmed.
- Do not enable community quantized artifacts unless their provenance and
  license chain are independently verified.
- Do not bundle eSpeak NG or PyMuPDF into a closed-source client without legal
  review or commercial licensing.
