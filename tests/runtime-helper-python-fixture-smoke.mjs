import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const pythonExecutable = process.env.JARVIS_K_RUNTIME_PYTHON;
if (!pythonExecutable) {
  console.error("JARVIS_K_RUNTIME_PYTHON is required for this smoke.");
  process.exit(2);
}

const fixtureRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "jarvis-k-transformers-fixture-")
);
const fixturePython = `
import os
import sys
from transformers import BertConfig, BertModel, BertTokenizer

root = sys.argv[1]
with open(os.path.join(root, "vocab.txt"), "w", encoding="utf-8") as handle:
    handle.write(
        "[PAD]\\n[UNK]\\n[CLS]\\n[SEP]\\n[MASK]\\n"
        "local\\ntransformers\\nchild\\nprocess\\nhello\\nworld\\n"
    )
tokenizer = BertTokenizer(os.path.join(root, "vocab.txt"))
tokenizer.save_pretrained(root)
config = BertConfig(
    vocab_size=11,
    hidden_size=8,
    num_hidden_layers=1,
    num_attention_heads=2,
    intermediate_size=16,
    max_position_embeddings=32,
)
BertModel(config).save_pretrained(root, safe_serialization=True)
`;

try {
  execFileSync(pythonExecutable, ["-c", fixturePython, fixtureRoot], {
    stdio: ["ignore", "ignore", "ignore"],
    windowsHide: true
  });

  const output = execFileSync(
    process.execPath,
    ["tests/runtime-helper-python-smoke.mjs"],
    {
      env: {
        JARVIS_K_RUNTIME_PYTHON: pythonExecutable,
        JARVIS_K_TRANSFORMERS_MODEL_DIR: fixtureRoot,
        JARVIS_K_RUNTIME_EXPECT_MODEL: "1",
        HF_HUB_OFFLINE: "1",
        TRANSFORMERS_OFFLINE: "1",
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1"
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true
    }
  );
  process.stdout.write(output);
} catch {
  console.error(
    "FAIL runtime Transformers fixture smoke: external Python environment is unavailable or incompatible."
  );
  process.exitCode = 1;
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
