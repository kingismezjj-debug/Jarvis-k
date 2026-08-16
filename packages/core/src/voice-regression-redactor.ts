const MAX_TEXT_LENGTH = 500;
const SENSITIVE_KEY_PATTERN =
  /(?:authorization|bearer|cookie|credential|password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|content|file|path|query|message|text|prompt|alias|url)/iu;

type RedactionResult<T> =
  | { ok: true; value: T; redactions: string[] }
  | { ok: false; redactions: string[] };

type TextRule = {
  readonly label: string;
  readonly pattern: RegExp;
  readonly replacement: string;
};

const TEXT_RULES: readonly TextRule[] = [
  {
    label: "bearer_token",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/giu,
    replacement: "Bearer [redacted]",
  },
  {
    label: "jwt",
    pattern:
      /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/gu,
    replacement: "[redacted:jwt]",
  },
  {
    label: "api_key",
    pattern:
      /\b(?:sk-(?:ant-)?|AIza|xox[baprs]-)[A-Za-z0-9_-]{16,}\b/giu,
    replacement: "[redacted:api_key]",
  },
  {
    label: "email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
    replacement: "[redacted:email]",
  },
  {
    label: "phone",
    pattern: /(?<!\w)(?:\+?\d{1,3}[-.\s])?\(?\d{3,4}\)?[-.\s]\d{3,4}[-.\s]\d{4}(?!\w)/gu,
    replacement: "[redacted:phone]",
  },
  {
    label: "windows_path",
    pattern: /\b[A-Z]:\\[^\s"'<>|]+/giu,
    replacement: "[redacted:path]",
  },
  {
    label: "unc_path",
    pattern: /\\\\[^\s\\/"'<>|]+\\[^\s"'<>|]+/gu,
    replacement: "[redacted:unc_path]",
  },
  {
    label: "url_parameters",
    pattern: /(https?:\/\/[^\s?#]+)[?#][^\s"'<>]+/giu,
    replacement: "$1[redacted:url_parameters]",
  },
  {
    label: "ip_address",
    pattern:
      /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/gu,
    replacement: "[redacted:ip]",
  },
  {
    label: "long_number",
    pattern: /\b\d{16,}\b/gu,
    replacement: "[redacted:number]",
  },
  {
    label: "secret_assignment",
    pattern:
      /\b(?:password|passwd|secret|token|api[_-]?key|authorization|credential)\s*[:=]\s*\S+/giu,
    replacement: "[redacted:secret_assignment]",
  },
];

const SENSITIVE_SCAN_RULES: readonly TextRule[] = TEXT_RULES;

export function redactVoiceRegressionText(
  value: string,
): RedactionResult<string> {
  let text = value.trim().slice(0, MAX_TEXT_LENGTH);
  const redactions: string[] = [];
  for (const rule of TEXT_RULES) {
    if (!rule.pattern.test(text)) {
      rule.pattern.lastIndex = 0;
      continue;
    }
    rule.pattern.lastIndex = 0;
    text = text.replace(rule.pattern, rule.replacement);
    redactions.push(rule.label);
  }
  const remaining = scanVoiceRegressionSensitiveText(text);
  if (remaining.length > 0) {
    return { ok: false, redactions: unique([...redactions, ...remaining]) };
  }
  return { ok: true, value: text, redactions: unique(redactions) };
}

export function redactVoiceRegressionSlots(
  slots: Record<string, unknown>,
): RedactionResult<Record<string, unknown>> {
  const safeSlots: Record<string, unknown> = {};
  const redactions: string[] = [];
  for (const [key, value] of Object.entries(slots)) {
    const trimmedKey = key.slice(0, 128);
    if (SENSITIVE_KEY_PATTERN.test(trimmedKey)) {
      safeSlots[trimmedKey] = "[redacted]";
      redactions.push(`slot:${trimmedKey}`);
      continue;
    }
    if (typeof value === "string") {
      const redacted = redactVoiceRegressionText(value);
      if (!redacted.ok) {
        return { ok: false, redactions: unique([...redactions, ...redacted.redactions]) };
      }
      safeSlots[trimmedKey] = redacted.value;
      redactions.push(...redacted.redactions.map((label) => `slot:${label}`));
      continue;
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safeSlots[trimmedKey] = value;
      continue;
    }
    safeSlots[trimmedKey] = "[redacted]";
    redactions.push(`slot:${trimmedKey}`);
  }
  return { ok: true, value: safeSlots, redactions: unique(redactions) };
}

export function scanVoiceRegressionSensitiveText(text: string): string[] {
  const findings: string[] = [];
  for (const rule of SENSITIVE_SCAN_RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) {
      findings.push(rule.label);
    }
    rule.pattern.lastIndex = 0;
  }
  return unique(findings);
}

function unique(values: string[]): string[] {
  return [...new Set(values)].slice(0, 32);
}
