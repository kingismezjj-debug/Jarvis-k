const path = require("node:path");
const { app, safeStorage } = require("electron");
const {
  SecureTtsProviderStore
} = require("../apps/desktop/dist/secure-tts-provider-store.js");

const FIXED_TEXT = "Jarvis-K TTS diagnostic.";

void main();

async function main() {
  try {
    await app.whenReady();
    const store = new SecureTtsProviderStore(
      path.join(app.getPath("userData"), "jarvis-k-tts-provider.json"),
      {
        isAvailable: () => safeStorage.isEncryptionAvailable(),
        encrypt: (value) => safeStorage.encryptString(value),
        decrypt: (value) => safeStorage.decryptString(value)
      }
    );
    const configuration = await store.load();
    if (!configuration) {
      finish(1, {
        status: "BLOCKED",
        reasonCode: "TTS_NOT_CONFIGURED",
        credentialExposed: false
      });
      return;
    }
    const result = await synthesizeDoubaoTts(configuration);
    finish(result.ok ? 0 : 1, {
      status: result.ok ? "PASS" : "FAILED",
      provider: "doubao",
      voiceId: configuration.voiceId,
      resourceId: resolveDoubaoResourceId(
        configuration.voiceId,
        configuration.resourceId
      ),
      ok: result.ok,
      code: result.code ?? null,
      audioByteBucket: result.audioByteBucket ?? null,
      contentType: result.contentType ?? null,
      credentialExposed: false
    });
  } catch (error) {
    finish(1, {
      status: "FAILED",
      reasonCode:
        error instanceof Error ? error.message : "TTS_SYNTHESIS_DIAGNOSTIC_FAILED",
      credentialExposed: false
    });
  }
}

async function synthesizeDoubaoTts(configuration) {
  const resourceId = resolveDoubaoResourceId(
    configuration.voiceId,
    configuration.resourceId
  );
  const requestId = `jarvis_diag_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(
      "https://openspeech.bytedance.com/api/v3/tts/unidirectional",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": configuration.credentials.apiKey,
          "X-Api-Resource-Id": resourceId,
          "X-Api-Request-Id": requestId
        },
        body: JSON.stringify({
          user: { uid: "jarvis-k" },
          req_params: {
            text: FIXED_TEXT,
            speaker: configuration.voiceId,
            audio_params: {
              format: "mp3",
              sample_rate: 24_000
            }
          }
        }),
        signal: controller.signal
      }
    );

    if (!response.ok) {
      await response.text().catch(() => "");
      return {
        ok: false,
        code: `HTTP_${response.status}`
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("audio/")) {
      return {
        ok: true,
        contentType,
        audioByteBucket: bucketBytes((await response.arrayBuffer()).byteLength)
      };
    }

    const rawText = await response.text();
    const byteLength = decodeDoubaoTtsByteLength(rawText);
    if (byteLength <= 0) {
      return {
        ok: false,
        code: "NO_AUDIO"
      };
    }
    return {
      ok: true,
      contentType: "text/event-stream",
      audioByteBucket: bucketBytes(byteLength)
    };
  } catch (error) {
    return {
      ok: false,
      code:
        error instanceof Error && error.name === "AbortError"
          ? "TIMEOUT"
          : "NETWORK_FAILED"
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function resolveDoubaoResourceId(voiceId, resourceId) {
  if (resourceId) {
    return resourceId;
  }
  if (/_moon_bigtts$/u.test(voiceId) || /^BV\d+(_24k)?_streaming$/u.test(voiceId)) {
    return "seed-tts-1.0";
  }
  return "seed-tts-2.0";
}

function decodeDoubaoTtsByteLength(rawText) {
  let total = 0;
  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^data:\s*/, "");
    if (!line || line === "[DONE]" || !line.startsWith("{")) {
      continue;
    }
    try {
      const data = JSON.parse(line);
      if (typeof data.data === "string" && data.data.length > 0) {
        total += Buffer.from(data.data, "base64").byteLength;
      }
    } catch {
      return 0;
    }
  }
  return total;
}

function bucketBytes(byteLength) {
  if (byteLength <= 0) return "zero";
  if (byteLength < 1024) return "tiny";
  if (byteLength < 16 * 1024) return "small";
  if (byteLength < 128 * 1024) return "medium";
  return "large";
}

function finish(exitCode, report) {
  console.log(JSON.stringify(report));
  app.exit(exitCode);
}
