import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const DEFAULT_ROOT = path.resolve(import.meta.dirname, "..");

const DEFAULT_SCAN_ROOTS = [
  "apps/ui/src",
  "apps/desktop/src",
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

const VISIBLE_ATTRIBUTE_NAMES = new Set([
  "aria-label",
  "alt",
  "label",
  "placeholder",
  "title",
  "value",
]);

const VISIBLE_PROPERTY_NAMES = new Set([
  "ariaLabel",
  "description",
  "displayName",
  "empty",
  "error",
  "helper",
  "label",
  "message",
  "notice",
  "placeholder",
  "safeMessage",
  "status",
  "subtitle",
  "summary",
  "text",
  "title",
  "tooltip",
  "value",
]);

const VISIBLE_CALL_NAMES = new Set([
  "alert",
  "confirm",
  "showErrorBox",
  "showMessageBox",
  "notifyAction",
  "trackAction",
]);

const BRAND_OR_ID_PATTERNS = [
  /^JARVIS-K$/,
  /^Jarvis-K(?: Alpha)?$/,
  /^JK$/,
  /^GLM(?:-\d(?:\.\d)?)?$/,
  /^DeepSeek$/,
  /^Qwen(?: Fast Router)?$/,
  /^Xunfei$/,
  /^Volcengine$/,
  /^IPC$/,
  /^MCP$/,
  /^OCR$/,
  /^TTS$/,
  /^PTT$/,
  /^GPU$/,
  /^CPU$/,
  /^HTTP$/,
  /^HTTPS$/,
  /^[a-z][a-z0-9.-]+:[a-z0-9._-]+$/i,
  /^[a-z0-9._-]+\/[a-z0-9._-]+$/i,
  /^[a-z0-9._-]+(?:_[a-z0-9._-]+){2,}$/i,
];

const MOJIBAKE_PATTERN =
  /(?:锛|涓|浠|绋|鐨|璇|闃|寰|鏄|杩|濂|鎺|妯|鍔|瀹|€|鈥|銆|�)/;
const CJK_PATTERN = /[\u3400-\u9fff]/;
const ENGLISH_PATTERN = /[A-Za-z]/;

export function collectSourceFiles({
  rootDirectory = DEFAULT_ROOT,
  scanRoots = DEFAULT_SCAN_ROOTS,
} = {}) {
  const files = [];
  for (const scanRoot of scanRoots) {
    const absoluteRoot = path.resolve(rootDirectory, scanRoot);
    if (!existsSync(absoluteRoot)) continue;
    for (const file of walk(absoluteRoot)) {
      if (SOURCE_EXTENSIONS.has(path.extname(file))) {
        files.push(path.relative(rootDirectory, file).replaceAll(path.sep, "/"));
      }
    }
  }
  return files.sort();
}

export function auditRepositoryStrings({
  rootDirectory = DEFAULT_ROOT,
  scanRoots = DEFAULT_SCAN_ROOTS,
} = {}) {
  const files = collectSourceFiles({ rootDirectory, scanRoots });
  const observations = files.flatMap((relativePath) =>
    auditSourceText({
      relativePath,
      text: readFileSync(path.resolve(rootDirectory, relativePath), "utf8"),
    }),
  );
  return summarizeObservations({ files, observations });
}

export function auditSourceText({ relativePath, text }) {
  const sourceKind = relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    sourceKind,
  );
  const observations = [];

  function add(node, rawValue, context, extra = {}) {
    const value = normalizeVisibleText(rawValue);
    if (!value) return;
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const classification = classifyValue({ context, relativePath, value });
    const flags = {
      mojibake: MOJIBAKE_PATTERN.test(value),
    };
    observations.push({
      classification,
      context,
      flags,
      line: position.line + 1,
      relativePath,
      value,
      ...extra,
    });
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      add(node, node.getText(sourceFile), "jsx_text");
    }

    if (ts.isJsxAttribute(node)) {
      const attributeName = node.name.getText(sourceFile);
      if (
        VISIBLE_ATTRIBUTE_NAMES.has(attributeName) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      ) {
        add(node.initializer, node.initializer.text, `jsx_attribute:${attributeName}`);
      }
    }

    if (ts.isJsxExpression(node) && node.expression) {
      const reference = expressionCopyReference(node.expression);
      if (reference) {
        add(node.expression, reference, "i18n_reference", { reference });
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const propertyName = propertyNameText(node.name);
      if (propertyName && VISIBLE_PROPERTY_NAMES.has(propertyName)) {
        const initializer = node.initializer;
        if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
          add(initializer, initializer.text, `object_property:${propertyName}`);
        }
      }
    }

    if (isCopyRegistryString(node, relativePath)) {
      add(node, node.text, "copy_registry");
    }

    if (ts.isCallExpression(node) && isVisibleCall(node.expression)) {
      const firstArgument = node.arguments[0];
      if (firstArgument) {
        if (ts.isStringLiteral(firstArgument) || ts.isNoSubstitutionTemplateLiteral(firstArgument)) {
          add(firstArgument, firstArgument.text, "visible_call");
        } else if (ts.isTemplateExpression(firstArgument)) {
          add(firstArgument, templateExpressionShape(firstArgument), "visible_call_template");
        } else if (ts.isArrayLiteralExpression(firstArgument)) {
          for (const element of firstArgument.elements) {
            if (ts.isStringLiteral(element)) {
              add(element, element.text, "visible_call_array");
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return observations;
}

export function summarizeObservations({ files, observations }) {
  const counts = {
    alreadyI18n: 0,
    brandOrProvider: 0,
    developerEvaluation: 0,
    dynamicNeedsReview: 0,
    hardcodedChinese: 0,
    hardcodedEnglish: 0,
    missingI18n: 0,
    mojibake: 0,
    totalUserVisible: observations.length,
  };
  const byFile = new Map();
  for (const item of observations) {
    counts[item.classification] = (counts[item.classification] ?? 0) + 1;
    if (item.flags?.mojibake) {
      counts.mojibake += 1;
    }
    const existing = byFile.get(item.relativePath) ?? 0;
    byFile.set(item.relativePath, existing + 1);
  }
  counts.missingI18n =
    counts.developerEvaluation +
    counts.hardcodedChinese +
    counts.hardcodedEnglish +
    counts.dynamicNeedsReview;
  return {
    counts,
    filesScanned: files.length,
    observations,
    topFiles: [...byFile.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 20)
      .map(([relativePath, count]) => ({ count, relativePath })),
  };
}

function classifyValue({ context, relativePath, value }) {
  if (context === "copy_registry" || context === "i18n_reference") {
    return "alreadyI18n";
  }
  if (MOJIBAKE_PATTERN.test(value)) {
    return "mojibake";
  }
  if (isDeveloperEvaluationPath(relativePath) || /Developer|Evaluation|Acceptance|diagnostic/i.test(value)) {
    return "developerEvaluation";
  }
  if (BRAND_OR_ID_PATTERNS.some((pattern) => pattern.test(value))) {
    return "brandOrProvider";
  }
  if (/[${}]/.test(value) || /\bunknown\b|\bavailable\b|\bconfigured\b/i.test(value)) {
    return "dynamicNeedsReview";
  }
  if (CJK_PATTERN.test(value)) {
    return "hardcodedChinese";
  }
  if (ENGLISH_PATTERN.test(value)) {
    return "hardcodedEnglish";
  }
  return "dynamicNeedsReview";
}

function expressionCopyReference(expression) {
  const text = expression.getText();
  if (/^(copy|alphaCopy|uiCopy|stage5Copy)\./.test(text)) {
    return text;
  }
  return null;
}

function isCopyRegistryString(node, relativePath) {
  return (
    relativePath.replaceAll("\\", "/") === "apps/ui/src/app/copy.ts" &&
    ts.isStringLiteral(node)
  );
}

function isVisibleCall(expression) {
  const text = expression.getText();
  const name = text.split(".").pop();
  return name ? VISIBLE_CALL_NAMES.has(name) : false;
}

function isDeveloperEvaluationPath(relativePath) {
  return /developer|diagnostic|acceptance|runtime-inspector|voice-regression/i.test(
    relativePath,
  );
}

function normalizeVisibleText(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "");
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function templateExpressionShape(node) {
  return node.getText().replace(/\$\{[^}]+\}/g, "${value}");
}

function walk(directory) {
  const entries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walk(fullPath));
    } else if (entry.isFile() || statSync(fullPath).isFile()) {
      entries.push(fullPath);
    }
  }
  return entries;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const json = process.argv.includes("--json");
  const includeSamples = process.argv.includes("--include-samples");
  const result = auditRepositoryStrings();
  const payload = includeSamples
    ? result
    : {
        counts: result.counts,
        filesScanned: result.filesScanned,
        topFiles: result.topFiles,
      };
  if (json || includeSamples) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`UI files scanned: ${result.filesScanned}`);
    console.log(`Total user-visible observations: ${result.counts.totalUserVisible}`);
    console.log(`Already i18n: ${result.counts.alreadyI18n}`);
    console.log(`Missing i18n: ${result.counts.missingI18n}`);
    console.log(`Hardcoded English: ${result.counts.hardcodedEnglish}`);
    console.log(`Hardcoded Chinese: ${result.counts.hardcodedChinese}`);
    console.log(`Mojibake: ${result.counts.mojibake}`);
  }
}
