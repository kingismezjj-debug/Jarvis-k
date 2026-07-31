import type { ModelCandidate } from "@jarvis-k/contracts";

const checkedAt = "2026-07-31T00:00:00.000Z";

export const recommendedModelCandidates: ModelCandidate[] = [
  {
    id: "openai/whisper-large-v3-turbo",
    capability: "speech_to_text",
    source: "huggingface",
    officialUrl: "https://huggingface.co/openai/whisper-large-v3-turbo",
    license: "MIT",
    licenseRisk: "yellow",
    distributionRisk: "yellow",
    runtime: "ctranslate2",
    recommendedMode: "local_enhanced",
    downloadEnabled: false,
    audit: {
      checkedAt,
      evidenceUrls: [
        "https://huggingface.co/openai/whisper-large-v3-turbo",
        "https://github.com/SYSTRAN/faster-whisper",
        "https://github.com/OpenNMT/CTranslate2"
      ],
      pinStatus: "pending_pin",
      notes: [
        "High-value STT candidate, but Jarvis-K must pin an exact converted artifact and SHA-256 before enabling download.",
        "Use through a provider adapter; do not import faster-whisper or CTranslate2 into Core."
      ]
    }
  },
  {
    id: "PaddlePaddle/PaddleOCR",
    capability: "ocr",
    source: "third_party",
    officialUrl: "https://github.com/PaddlePaddle/PaddleOCR",
    license: "Apache-2.0",
    licenseRisk: "yellow",
    distributionRisk: "yellow",
    runtime: "paddle",
    recommendedMode: "standard",
    downloadEnabled: false,
    audit: {
      checkedAt,
      evidenceUrls: [
        "https://github.com/PaddlePaddle/PaddleOCR",
        "https://github.com/PaddlePaddle/PaddleOCR/blob/main/LICENSE",
        "https://artifex.com/licensing"
      ],
      pinStatus: "pending_pin",
      notes: [
        "Image OCR is a strong first local model candidate.",
        "PDF parsing must stay split from image OCR until PyMuPDF/AGPL exposure is removed or commercially licensed."
      ]
    }
  },
  {
    id: "Qwen/Qwen3-Embedding-0.6B",
    capability: "embedding",
    source: "huggingface",
    officialUrl: "https://huggingface.co/Qwen/Qwen3-Embedding-0.6B",
    license: "Apache-2.0",
    licenseRisk: "yellow",
    distributionRisk: "yellow",
    runtime: "transformers",
    recommendedMode: "standard",
    downloadEnabled: false,
    audit: {
      checkedAt,
      evidenceUrls: [
        "https://huggingface.co/Qwen/Qwen3-Embedding-0.6B",
        "https://github.com/QwenLM/Qwen3-Embedding"
      ],
      pinStatus: "pending_pin",
      notes: [
        "Candidate for local bilingual memory retrieval after benchmark and exact artifact pinning.",
        "Start with embedding only; defer reranker residency."
      ]
    }
  },
  {
    id: "Qwen/Qwen3-0.6B",
    capability: "intent_router",
    source: "huggingface",
    officialUrl: "https://huggingface.co/Qwen/Qwen3-0.6B",
    license: "Apache-2.0",
    licenseRisk: "yellow",
    distributionRisk: "yellow",
    runtime: "transformers",
    recommendedMode: "local_enhanced",
    downloadEnabled: false,
    audit: {
      checkedAt,
      evidenceUrls: [
        "https://huggingface.co/Qwen/Qwen3-0.6B",
        "https://github.com/QwenLM/Qwen3"
      ],
      pinStatus: "pending_pin",
      notes: [
        "Candidate for rules-first intent routing experiments.",
        "Never allow router output to execute arbitrary shell commands."
      ]
    }
  }
];
