import { createHash } from "node:crypto";

export const v11DatasetVersion = "1.1";
export const v11ParentVersion = "1";
export const v11ParentDigest =
  "f8fac54bc046cc48c4f422ca541f7f9c829558a1db125bc8094a6092d23d2450";
export const v11FixedSeed = "jarvis-k-voice-command-zh-cn-v1.1-split-seed-2026-08-16";
export const v11SimilarityThreshold = 0.9;
export const v11NormalizationVersion = "zh-cn-text-normalization-v1";
export const v11SplitAlgorithmVersion = "group-aware-connected-components-v1";
export const v11GeneratedAt = "2026-08-16T00:00:00.000Z";

const splitNames = ["train", "dev", "test"];
const splitRatios = { train: 0.7, dev: 0.15, test: 0.15 };
const requiredTestMinimums = {
  ambiguous_or_dangerous: 15,
  plugin_command: 8,
  negative: 8,
  asr_error: 15,
  normal_command: 45,
};
const requiredTestIntents = [
  "localApp.open",
  "browser.open",
  "filesystem.search",
  "plugin.invoke",
  "chat.answer",
  "clarify",
  "blocked",
];

export function migrateV1ToV11(records) {
  const graph = buildSimilarityGraph(records);
  const components = buildComponents(records, graph);
  const assignments = assignComponentsToSplits(records, components);
  const componentIdByRecordId = new Map();
  const groupIdByRecordId = new Map();

  for (const component of components) {
    const split = assignments.get(component.id);
    for (const index of component.recordIndexes) {
      const record = records[index];
      componentIdByRecordId.set(record.id, component.id);
      groupIdByRecordId.set(record.id, deriveV11GroupId(record));
      if (!split) {
        throw new Error(`Missing split assignment for component ${component.id}`);
      }
    }
  }

  return records.map((record) => ({
    ...cloneJson(record),
    schemaVersion: 1,
    datasetVersion: v11DatasetVersion,
    split: assignments.get(componentIdByRecordId.get(record.id)),
    groupId: groupIdByRecordId.get(record.id),
    similarityGroupId: componentIdByRecordId.get(record.id),
    quality: {
      parentDatasetVersion: v11ParentVersion,
      parentRecordId: record.id,
      splitSeed: v11FixedSeed,
      splitAlgorithmVersion: v11SplitAlgorithmVersion,
      normalizationVersion: v11NormalizationVersion,
      similarityThreshold: v11SimilarityThreshold,
    },
  }));
}

export function buildV11Manifest(records, options) {
  const graph = buildSimilarityGraph(records);
  const components = buildComponents(records, graph);
  const leakage = detectV11Leakage(records);
  return {
    schemaVersion: 1,
    datasetVersion: v11DatasetVersion,
    parentVersion: v11ParentVersion,
    parentDigest: v11ParentDigest,
    currentDigest: options.currentDigest,
    generatedAt: v11GeneratedAt,
    splitAlgorithmVersion: v11SplitAlgorithmVersion,
    normalizationVersion: v11NormalizationVersion,
    similarityThreshold: v11SimilarityThreshold,
    fixedSeed: v11FixedSeed,
    totalSamples: records.length,
    totalGroups: new Set(records.map((record) => record.groupId)).size,
    totalSimilarityComponents: components.length,
    largestComponent: Math.max(...components.map((component) => component.recordIndexes.length), 0),
    splitCounts: countBy(records, (record) => record.split),
    categoryBySplit: nestedCount(records, (record) => record.split, (record) => record.category),
    modeBySplit: nestedCount(records, (record) => record.split, (record) => record.mode),
    intentBySplit: nestedCount(records, (record) => record.split, (record) => record.expected.intent),
    riskBySplit: nestedCount(records, (record) => record.split, riskForV11Record),
    provenanceBySplit: nestedCount(records, (record) => record.split, (record) => record.provenance),
    crossGroupLeakage: leakage.crossGroupLeakage,
    crossSimilarityLeakage: leakage.crossSimilarityLeakage,
  };
}

export function validateV11Records(records, parentRecords, options = {}) {
  const failures = [];
  const parentById = new Map(parentRecords.map((record) => [record.id, record]));
  const ids = new Set();

  if (records.length !== parentRecords.length) {
    failures.push(`expected ${parentRecords.length} records, got ${records.length}`);
  }

  for (const record of records) {
    if (ids.has(record.id)) {
      failures.push(`duplicate id ${record.id}`);
    }
    ids.add(record.id);
    if (record.datasetVersion !== v11DatasetVersion) {
      failures.push(`${record.id} datasetVersion must be ${v11DatasetVersion}`);
    }
    if (!splitNames.includes(record.split)) {
      failures.push(`${record.id} has invalid split ${record.split}`);
    }
    if (!record.groupId) {
      failures.push(`${record.id} is missing groupId`);
    }
    if (!record.similarityGroupId) {
      failures.push(`${record.id} is missing similarityGroupId`);
    }
    const parent = parentById.get(record.id);
    if (!parent) {
      failures.push(`${record.id} is not present in parent v1 dataset`);
      continue;
    }
    for (const field of [
      "category",
      "subcategory",
      "provenance",
      "locale",
      "rawTranscript",
      "intendedText",
      "mode",
    ]) {
      if (record[field] !== parent[field]) {
        failures.push(`${record.id} changed immutable field ${field}`);
      }
    }
    for (const field of ["context", "expected", "tags"]) {
      if (stableStringify(record[field]) !== stableStringify(parent[field])) {
        failures.push(`${record.id} changed immutable field ${field}`);
      }
    }
  }

  const expectedRecords = migrateV1ToV11(parentRecords);
  const expectedById = new Map(expectedRecords.map((record) => [record.id, record]));
  for (const record of records) {
    const expected = expectedById.get(record.id);
    if (!expected) continue;
    for (const field of ["split", "groupId", "similarityGroupId"]) {
      if (record[field] !== expected[field]) {
        failures.push(
          `${record.id} ${field} expected ${expected[field]}, got ${record[field]}`,
        );
      }
    }
  }

  const leakage = detectV11Leakage(records);
  if (leakage.crossGroupLeakage.count > 0) {
    failures.push(`cross split group leakage count ${leakage.crossGroupLeakage.count}`);
  }
  if (leakage.crossSimilarityLeakage.count > 0) {
    failures.push(`cross split similarity leakage count ${leakage.crossSimilarityLeakage.count}`);
  }

  const splitCounts = countBy(records, (record) => record.split);
  for (const split of splitNames) {
    if ((splitCounts[split] ?? 0) === 0) {
      failures.push(`split ${split} has no records`);
    }
  }

  const testRecords = records.filter((record) => record.split === "test");
  const testCategoryCounts = countBy(testRecords, (record) => record.category);
  for (const [category, minimum] of Object.entries(requiredTestMinimums)) {
    if ((testCategoryCounts[category] ?? 0) < minimum) {
      failures.push(
        `test category ${category} has ${testCategoryCounts[category] ?? 0}, expected at least ${minimum}`,
      );
    }
  }
  const testIntents = new Set(testRecords.map((record) => record.expected.intent));
  for (const intent of requiredTestIntents) {
    if (!testIntents.has(intent)) {
      failures.push(`test split is missing major intent ${intent}`);
    }
  }
  if (!testRecords.some((record) => record.expected.blocked || record.tags?.includes("dangerous"))) {
    failures.push("test split is missing dangerous/blocked samples");
  }

  if (options.manifest) {
    const expectedManifest = buildV11Manifest(records, {
      currentDigest: options.currentDigest,
    });
    for (const field of [
      "datasetVersion",
      "parentVersion",
      "parentDigest",
      "currentDigest",
      "splitAlgorithmVersion",
      "normalizationVersion",
      "similarityThreshold",
      "fixedSeed",
      "totalSamples",
      "totalGroups",
      "totalSimilarityComponents",
      "largestComponent",
      "crossGroupLeakage",
      "crossSimilarityLeakage",
    ]) {
      if (stableStringify(options.manifest[field]) !== stableStringify(expectedManifest[field])) {
        failures.push(`manifest field ${field} does not match regenerated value`);
      }
    }
  }

  return {
    status: failures.length === 0 ? "PASS" : "FAIL",
    failures,
    leakage,
    splitCounts,
    testCategoryCounts,
  };
}

export function assertV11LockedSplitAllowed(split, allowLockedTest) {
  if ((split === "test" || split === "all") && !allowLockedTest) {
    throw new Error(
      "LOCKED_TEST_SPLIT_REQUIRES_ALLOW_LOCKED_TEST: rerun with --allow-locked-test to evaluate test/all.",
    );
  }
}

export function detectV11Leakage(records) {
  return {
    crossGroupLeakage: leakageForKey(records, (record) => record.groupId),
    crossSimilarityLeakage: leakageForKey(records, (record) => record.similarityGroupId),
  };
}

export function buildSimilarityGraph(records) {
  const parent = Array.from({ length: records.length }, (_, index) => index);
  const rawNormalized = records.map((record) => normalizeV11Text(record.rawTranscript));
  const intendedNormalized = records.map((record) => normalizeV11Text(record.intendedText));
  const templates = records.map((record) => sentencePattern(record.rawTranscript));
  const groupIds = records.map(deriveV11GroupId);

  const find = (index) => {
    let current = index;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parent[Math.max(leftRoot, rightRoot)] = Math.min(leftRoot, rightRoot);
    }
  };

  for (let left = 0; left < records.length; left += 1) {
    for (let right = left + 1; right < records.length; right += 1) {
      if (groupIds[left] === groupIds[right]) {
        union(left, right);
        continue;
      }
      if (
        compositeSimilarity({
          left,
          right,
          records,
          rawNormalized,
          intendedNormalized,
          templates,
        }) >= v11SimilarityThreshold
      ) {
        union(left, right);
      }
    }
  }

  return { find, parent };
}

export function buildComponents(records, graph = buildSimilarityGraph(records)) {
  const groups = new Map();
  for (let index = 0; index < records.length; index += 1) {
    const root = graph.find(index);
    const key = `sim-${String(root + 1).padStart(4, "0")}`;
    groups.set(key, [...(groups.get(key) ?? []), index]);
  }
  return [...groups.entries()]
    .map(([id, recordIndexes]) => ({
      id,
      recordIndexes,
      sortKey: seededHash(`${v11FixedSeed}:${id}:${recordIndexes.map((index) => records[index].id).join("|")}`),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function deriveV11GroupId(record) {
  return [
    "grp",
    record.category,
    record.subcategory,
    record.mode,
    record.expected.intent,
    sentencePattern(record.intendedText || record.rawTranscript),
  ].join(":");
}

export function normalizeV11Text(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[，。！？、；：,.!?;:"'“”‘’()[\]{}<>《》【】]/gu, "")
    .replace(/\s+/gu, "")
    .replace(/v\s*s\s*code/giu, "vscode")
    .replace(/vs\s*code/giu, "vscode")
    .replace(/visual\s*studio\s*code/giu, "vscode")
    .replace(/git\s*hub/giu, "github")
    .replace(/ec\s*token/giu, "ectoken")
    .replace(/izy\s*token/giu, "izytoken")
    .replace(/q\s*wen/giu, "qwen")
    .trim();
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function riskForV11Record(record) {
  if (record.expected.blocked || record.tags?.includes("dangerous")) return "dangerous";
  if (record.expected.clarificationRequired || record.tags?.includes("ambiguous")) return "ambiguous";
  if (record.expected.autoExecuteAllowed) return "auto_eligible";
  return "safe_non_auto";
}

export function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function nestedCount(items, outerSelector, innerSelector) {
  return items.reduce((counts, item) => {
    const outer = outerSelector(item);
    const inner = innerSelector(item);
    counts[outer] ??= {};
    counts[outer][inner] = (counts[outer][inner] ?? 0) + 1;
    return counts;
  }, {});
}

function assignComponentsToSplits(records, components) {
  const targets = splitTargets(records.length);
  const assignments = new Map();
  const splitState = Object.fromEntries(splitNames.map((split) => [split, { count: 0, records: [] }]));
  const enriched = components.map((component) => ({
    ...component,
    records: component.recordIndexes.map((index) => records[index]),
  }));

  const ordered = [...enriched].sort((left, right) => {
    if (right.records.length !== left.records.length) return right.records.length - left.records.length;
    return left.sortKey.localeCompare(right.sortKey);
  });

  for (const component of ordered) {
    const split = chooseSplit(component, splitState, targets, records.length);
    assignments.set(component.id, split);
    splitState[split].count += component.records.length;
    splitState[split].records.push(...component.records);
  }

  rebalanceTestMinimums(enriched, assignments, splitState, targets);
  rebalanceTestIntents(enriched, assignments, splitState);
  return assignments;
}

function chooseSplit(component, splitState, targets, totalRecords) {
  const scores = splitNames.map((split) => {
    const projected = splitState[split].count + component.records.length;
    const overflow = Math.max(0, projected - targets[split]);
    const balanceCost = Math.abs(targets[split] - projected) / totalRecords;
    const distributionCost = distributionCostFor(split, component, splitState, targets);
    return {
      split,
      score: overflow * 20 + balanceCost + distributionCost,
    };
  });
  scores.sort((left, right) => left.score - right.score || left.split.localeCompare(right.split));
  return scores[0].split;
}

function distributionCostFor(split, component, splitState, targets) {
  const currentRecords = splitState[split].records;
  const projectedRecords = [...currentRecords, ...component.records];
  const targetRatio = targets[split] / componentTotalTarget(targets);
  let cost = 0;
  for (const selector of [
    (record) => record.category,
    (record) => record.mode,
    (record) => record.expected.intent,
    riskForV11Record,
    (record) => record.provenance,
  ]) {
    const allCount = countBy([...Object.values(splitState).flatMap((state) => state.records), ...component.records], selector);
    const projectedCount = countBy(projectedRecords, selector);
    for (const [key, value] of Object.entries(projectedCount)) {
      const expected = (allCount[key] ?? value) * targetRatio;
      cost += Math.abs(value - expected) / Math.max(expected, 1);
    }
  }
  return cost * 0.01;
}

function rebalanceTestMinimums(components, assignments, splitState, targets) {
  const categories = () => countBy(splitState.test.records, (record) => record.category);
  for (const [category, minimum] of Object.entries(requiredTestMinimums)) {
    while ((categories()[category] ?? 0) < minimum) {
      const candidate = components
        .filter((component) => assignments.get(component.id) !== "test")
        .filter((component) => component.records.some((record) => record.category === category))
        .sort((left, right) => {
          if (left.records.length !== right.records.length) return left.records.length - right.records.length;
          return left.sortKey.localeCompare(right.sortKey);
        })[0];
      if (!candidate) break;
      moveComponent(candidate, assignments, splitState, "test");
    }
  }

  while (splitState.test.count > targets.test + 8) {
    const candidate = components
      .filter((component) => assignments.get(component.id) === "test")
      .filter((component) => {
        const after = splitState.test.records.filter((record) => !component.records.includes(record));
        const afterCounts = countBy(after, (record) => record.category);
        return Object.entries(requiredTestMinimums).every(
          ([category, minimum]) => (afterCounts[category] ?? 0) >= minimum,
        );
      })
      .sort((left, right) => right.records.length - left.records.length || left.sortKey.localeCompare(right.sortKey))[0];
    if (!candidate) break;
    const targetSplit = splitState.dev.count <= splitState.train.count - targets.train + targets.dev ? "dev" : "train";
    moveComponent(candidate, assignments, splitState, targetSplit);
  }
}

function rebalanceTestIntents(components, assignments, splitState) {
  const intents = () => new Set(splitState.test.records.map((record) => record.expected.intent));
  for (const intent of requiredTestIntents) {
    if (intents().has(intent)) continue;
    const candidate = components
      .filter((component) => assignments.get(component.id) !== "test")
      .filter((component) => component.records.some((record) => record.expected.intent === intent))
      .sort((left, right) => {
        if (left.records.length !== right.records.length) return left.records.length - right.records.length;
        return left.sortKey.localeCompare(right.sortKey);
      })[0];
    if (candidate) {
      moveComponent(candidate, assignments, splitState, "test");
    }
  }
}

function moveComponent(component, assignments, splitState, toSplit) {
  const fromSplit = assignments.get(component.id);
  if (!fromSplit || fromSplit === toSplit) return;
  assignments.set(component.id, toSplit);
  splitState[fromSplit].records = splitState[fromSplit].records.filter(
    (record) => !component.records.includes(record),
  );
  splitState[fromSplit].count -= component.records.length;
  splitState[toSplit].records.push(...component.records);
  splitState[toSplit].count += component.records.length;
}

function splitTargets(total) {
  const train = Math.round(total * splitRatios.train);
  const dev = Math.round(total * splitRatios.dev);
  return { train, dev, test: total - train - dev };
}

function componentTotalTarget(targets) {
  return Object.values(targets).reduce((sum, value) => sum + value, 0);
}

function compositeSimilarity(input) {
  const { left, right, records, rawNormalized, intendedNormalized, templates } = input;
  const raw = diceSimilarity(rawNormalized[left], rawNormalized[right]);
  const intended = diceSimilarity(intendedNormalized[left], intendedNormalized[right]);
  const template = templates[left] === templates[right] ? 1 : diceSimilarity(templates[left], templates[right]);
  const metadata =
    records[left].category === records[right].category &&
    records[left].subcategory === records[right].subcategory &&
    records[left].expected.intent === records[right].expected.intent
      ? 1
      : 0;
  return Math.max(raw, raw * 0.65 + intended * 0.2 + template * 0.1 + metadata * 0.05);
}

function diceSimilarity(left, right) {
  if (left === right) return 1;
  if (!left || !right) return 0;
  if (left.includes(right) || right.includes(left)) {
    return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  }
  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length, 1);
}

function sentencePattern(value) {
  return normalizeV11Text(value)
    .replace(/vscode|vs code|notepad|calculator|powershell|github|izytoken|ec token|qwen|deepseek|codex/giu, "{entity}")
    .replace(/api\.izytoken\.com|github\.com|https?:\/\/[a-z0-9./_-]+/giu, "{url}")
    .replace(/[A-Z]{2,}|\d+/giu, "{entity}")
    .replace(/合同|报价单|jarvis日志|phase|voicebenchmark|茅台|腾讯|AAPL/giu, "{entity}")
    .slice(0, 96);
}

function levenshtein(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () =>
    Array.from({ length: right.length + 1 }, () => 0),
  );
  for (let row = 0; row <= left.length; row += 1) rows[row][0] = row;
  for (let column = 0; column <= right.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost,
      );
    }
  }
  return rows[left.length][right.length];
}

function leakageForKey(records, selector) {
  const groups = new Map();
  for (const record of records) {
    const key = selector(record);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  const leaking = [...groups.entries()]
    .map(([id, groupRecords]) => ({
      id,
      splits: [...new Set(groupRecords.map((record) => record.split))].sort(),
      count: groupRecords.length,
    }))
    .filter((group) => group.splits.length > 1);
  return {
    count: leaking.length,
    examples: leaking.slice(0, 20),
  };
}

function seededHash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
