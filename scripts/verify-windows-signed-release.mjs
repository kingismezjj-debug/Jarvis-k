import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  closeSync,
  mkdirSync,
  openSync,
  readSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const SIGNED_RELEASE_VERIFICATION_SCHEMA_VERSION = 1;
export const EXTERNAL_RELEASE_MANIFEST_SCHEMA_VERSION = 1;

export const REQUIRED_JARVIS_ROLES = Object.freeze([
  "final_nsis_installer",
  "main_exe",
  "uninstaller",
]);

const DEFAULT_FORBIDDEN_TEXT_PATTERNS = Object.freeze([
  /[A-Z]:\\Users\\/iu,
  /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret)\b\s*[:=]/iu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/u,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/u,
  /\bHKEY_(?:CURRENT_USER|LOCAL_MACHINE|USERS|CLASSES_ROOT)\\/iu,
]);

export function parseSignedReleaseVerificationArgs(argv = process.argv.slice(2)) {
  const options = {};
  for (const arg of argv) {
    if (arg === "--json") {
      options.json = true;
    } else if (arg.startsWith("--artifact-dir=")) {
      options.artifactDir = arg.slice("--artifact-dir=".length);
    } else if (arg.startsWith("--out=")) {
      options.out = arg.slice("--out=".length);
    } else if (arg.startsWith("--expected-signer-subject=")) {
      options.expectedSignerSubject = arg.slice("--expected-signer-subject=".length);
    } else if (arg.startsWith("--expected-signer-thumbprint=")) {
      options.expectedSignerThumbprint = arg.slice("--expected-signer-thumbprint=".length);
    } else if (arg.startsWith("--product-version=")) {
      options.productVersion = arg.slice("--product-version=".length);
    } else if (arg.startsWith("--app-id=")) {
      options.appId = arg.slice("--app-id=".length);
    } else if (arg.startsWith("--channel=")) {
      options.channel = arg.slice("--channel=".length);
    } else if (arg.startsWith("--downgrade-marker-ordinal=")) {
      options.downgradeMarkerOrdinal = Number.parseInt(
        arg.slice("--downgrade-marker-ordinal=".length),
        10,
      );
    } else if (arg === "--allow-synthetic-placeholder") {
      options.allowSyntheticPlaceholder = true;
    } else if (arg === "--real-signed-artifact-verified") {
      options.realSignedArtifactVerified = true;
    } else if (arg === "--allow-uninstaller-pending-isolated-install") {
      options.allowUninstallerPendingIsolatedInstall = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

export function verifySignedReleaseArtifacts(options = {}) {
  const artifactDir = requireExplicitArtifactDirectory(options.artifactDir);
  const expectedSigner = createExpectedSigner(options);
  const discoveredArtifacts = options.artifacts ?? discoverPeArtifacts(artifactDir);
  const signTool = options.signToolProbe ?? probeSignTool();
  const verifyAuthenticode =
    options.verifyAuthenticode ?? ((absolutePath) => readAuthenticodeSignature(absolutePath));
  const inspectDigest =
    options.inspectDigest ??
    ((absolutePath) =>
      inspectDigestWithSignTool(absolutePath, {
        signToolPath: signTool.path,
      }));

  const artifacts = discoveredArtifacts.map((artifact) => {
    const normalized = normalizeArtifactRecord(artifactDir, artifact);
    let signature;
    let digestInspection;
    try {
      signature = normalizeAuthenticodeResult(verifyAuthenticode(normalized.absolutePath));
    } catch (error) {
      signature = {
        status: "UnknownError",
        signerSubject: null,
        certificateThumbprint: null,
        timestampPresent: false,
        timestampValid: false,
        controlledError: "authenticode_read_failed",
        rawStatusMessage: sanitizeToolText(error?.message ?? "unknown"),
      };
    }

    try {
      digestInspection = normalizeDigestInspection(inspectDigest(normalized.absolutePath));
    } catch (error) {
      digestInspection = {
        digestAlgorithm: "unknown",
        controlledError: "signtool_verify_failed",
        rawStatusMessage: sanitizeToolText(error?.message ?? "unknown"),
      };
    }

    return classifyPeArtifact({
      ...normalized,
      signature,
      digestInspection,
      expectedSigner,
    });
  });

  const roleCounts = countRoles(artifacts);
  const uninstallerPendingIsolatedInstall = Boolean(
    options.allowUninstallerPendingIsolatedInstall && !roleCounts.uninstaller,
  );
  const missingRequiredRoles = REQUIRED_JARVIS_ROLES.filter(
    (role) => !roleCounts[role] && !(role === "uninstaller" && uninstallerPendingIsolatedInstall),
  );
  const releaseManifest = createExternalReleaseManifest({
    product: {
      name: options.productName ?? "Jarvis-K Alpha",
      version: options.productVersion ?? "0.1.0-alpha.7",
      appId: options.appId ?? "com.jarvis-k.desktop.alpha",
      channel: options.channel ?? "alpha",
    },
    installer: artifacts.find((artifact) => artifact.role === "final_nsis_installer") ?? null,
    expectedSigner,
    downgradeMarkerOrdinal: options.downgradeMarkerOrdinal ?? 6,
    supportedUpgradeFloor: options.supportedUpgradeFloor ?? "0.1.0-alpha.7",
  });

  const failedArtifacts = artifacts.filter((artifact) => artifact.verdict === "FAIL");
  const unresolvedArtifacts = artifacts.filter((artifact) => artifact.verdict === "UNRESOLVED");
  const invalidSignatureCount = artifacts.filter(
    (artifact) => artifact.signatureStatus !== "valid" && artifact.signatureStatus !== "not_signed",
  ).length;
  const unsignedUnexpectedCount = artifacts.filter(
    (artifact) =>
      artifact.signatureStatus === "not_signed" &&
      artifact.classification !== "unsigned_expected_with_documented_origin",
  ).length;
  const status =
    missingRequiredRoles.length > 0 || failedArtifacts.length > 0 || unresolvedArtifacts.length > 0
      ? "FAIL"
      : "PASS";
  const realSignedArtifactVerified = Boolean(
    options.realSignedArtifactVerified && status === "PASS" && expectedSigner.productionReady,
  );
  const report = {
    schemaVersion: SIGNED_RELEASE_VERIFICATION_SCHEMA_VERSION,
    phase: realSignedArtifactVerified
      ? "UI-3I-1H Azure Artifact Signing Signed Alpha.7 Build Retry"
      : "UI-3I-1A Signed Artifact Verification Harness Preparation",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    artifactRoot: {
      explicit: true,
      basename: path.basename(path.resolve(artifactDir)),
      fullPathRecorded: false,
    },
    expectedSigner: {
      subjectClassification: expectedSigner.subjectClassification,
      thumbprintClassification: expectedSigner.thumbprintClassification,
      productionReady: expectedSigner.productionReady,
    },
    toolchain: {
      powershellAuthenticode: true,
      signTool: {
        requiredForProduction: true,
        available: Boolean(signTool.available),
        pathRecorded: false,
        sourceClassification: signTool.available ? signTool.sourceClassification : "missing",
      },
    },
    product: releaseManifest.product,
    realSignedArtifactVerified,
    executionBlocked: !realSignedArtifactVerified,
    azureIdentity: realSignedArtifactVerified ? "verified" : "pending",
    externalDistributionAllowed: false,
    requiredRoles: {
      expected: REQUIRED_JARVIS_ROLES,
      missing: missingRequiredRoles,
    },
    uninstallerVerification: {
      status: roleCounts.uninstaller
        ? "verified"
        : uninstallerPendingIsolatedInstall
          ? "pending_isolated_install"
          : "missing",
    },
    artifacts,
    summary: {
      totalPeArtifacts: artifacts.length,
      failed: failedArtifacts.length,
      unresolved: unresolvedArtifacts.length,
      requiredRolesMissing: missingRequiredRoles.length,
      invalidSignatureCount,
      unsignedUnexpectedCount,
      classificationCounts: countClassifications(artifacts),
      status,
    },
    externalReleaseManifest: {
      ...releaseManifest,
      realSignedArtifactVerified,
      executionBlocked: !realSignedArtifactVerified,
      azureIdentity: realSignedArtifactVerified ? "verified" : "pending",
    },
  };

  assertReportIsSanitized(report);
  return report;
}

export function discoverPeArtifacts(artifactDir) {
  const root = requireExplicitArtifactDirectory(artifactDir);
  const files = walkFiles(root);
  return files
    .filter((absolutePath) => isPeBinary(absolutePath))
    .map((absolutePath) => normalizeArtifactRecord(root, absolutePath));
}

export function classifyPeArtifact(input) {
  const role = input.role ?? classifyArtifactRole(input.relativePath);
  const ownership = input.ownership ?? classifyArtifactOwnership(input.relativePath, role);
  const signature = normalizeAuthenticodeResult(input.signature);
  const digestInspection = normalizeDigestInspection(input.digestInspection);
  const expectedSigner = input.expectedSigner ?? createExpectedSigner({});
  const signatureStatus = classifySignatureStatus(signature.status);
  const signerSubjectClassification = classifySubject(
    signature.signerSubject,
    expectedSigner.subject,
  );
  const certificateThumbprintClassification = classifyThumbprint(
    signature.certificateThumbprint,
    expectedSigner.thumbprint,
  );
  const timestampClassification = classifyTimestamp(signature);
  const digestAlgorithm = classifyDigestAlgorithm(digestInspection.digestAlgorithm);
  const jarvisRequired = REQUIRED_JARVIS_ROLES.includes(role);
  const failureReasons = [];
  const unresolvedReasons = [];

  if (jarvisRequired) {
    if (!expectedSigner.productionReady) failureReasons.push("expected_signer_missing");
    if (signatureStatus !== "valid") failureReasons.push(`signature_${signatureStatus}`);
    if (signerSubjectClassification !== "exact_match") failureReasons.push("wrong_expected_publisher");
    if (certificateThumbprintClassification !== "exact_match") failureReasons.push("wrong_expected_thumbprint");
    if (timestampClassification !== "valid") failureReasons.push(`timestamp_${timestampClassification}`);
    if (digestAlgorithm !== "sha256") failureReasons.push(`digest_${digestAlgorithm}`);
  } else if (
    signatureStatus === "not_signed" &&
    classifyReleaseSignatureClass({
      role,
      ownership,
      signatureStatus,
      signerSubjectClassification,
      timestampClassification,
    }) !== "unsigned_expected_with_documented_origin"
  ) {
    unresolvedReasons.push("non_jarvis_pe_requires_review");
  } else if (signatureStatus !== "valid" && signatureStatus !== "not_signed") {
    unresolvedReasons.push("non_jarvis_pe_requires_review");
  } else if (signatureStatus === "valid" && timestampClassification !== "valid") {
    unresolvedReasons.push("non_jarvis_pe_requires_review");
  }

  if (
    role === "native_node" &&
    (signatureStatus !== "valid" || ownership !== "upstream")
  ) {
    if (!unresolvedReasons.includes("non_jarvis_pe_requires_review")) {
      unresolvedReasons.push("non_jarvis_pe_requires_review");
    }
    unresolvedReasons.push("native_binary_not_silently_accepted");
  }

  return {
    relativePath: input.relativePath,
    sha256: input.sha256 ?? sha256File(input.absolutePath),
    size: input.size ?? statSync(input.absolutePath).size,
    role,
    ownership,
    signatureStatus,
    signerSubjectClassification,
    certificateThumbprintClassification,
    digestAlgorithm,
    timestampClassification,
    classification: classifyReleaseSignatureClass({
      role,
      ownership,
      signatureStatus,
      signerSubjectClassification,
      timestampClassification,
    }),
    documentedOrigin: classifyDocumentedOrigin(input.relativePath, role, ownership),
    controlledError: signature.controlledError ?? digestInspection.controlledError ?? null,
    verdict: failureReasons.length > 0 ? "FAIL" : unresolvedReasons.length > 0 ? "UNRESOLVED" : "PASS",
    failureReasons,
    unresolvedReasons,
  };
}

export function createExternalReleaseManifest(input = {}) {
  const product = input.product ?? {
    name: "Jarvis-K Alpha",
    version: "0.1.0-alpha.7",
    appId: "com.jarvis-k.desktop.alpha",
    channel: "alpha",
  };
  const installer = input.installer;
  return {
    schemaVersion: EXTERNAL_RELEASE_MANIFEST_SCHEMA_VERSION,
    product,
    installer: {
      filename: installer?.relativePath ? path.posix.basename(installer.relativePath) : null,
      size: installer?.size ?? null,
      sha256: installer?.sha256 ?? null,
    },
    signer: {
      subjectClassification:
        input.expectedSigner?.subjectClassification ?? "expected_subject_missing",
      thumbprintClassification:
        input.expectedSigner?.thumbprintClassification ?? "expected_thumbprint_missing",
    },
    timestampClassification: installer?.timestampClassification ?? "not_verified",
    downgradeMarkerOrdinal: input.downgradeMarkerOrdinal ?? 6,
    supportedUpgradeFloor: input.supportedUpgradeFloor ?? "0.1.0-alpha.7",
    unsignedHistoricalInstallerWarning: true,
    publishUploadState: "disabled",
    realSignedArtifactVerified: false,
    executionBlocked: true,
    azureIdentity: "pending",
    externalDistributionAllowed: false,
  };
}

export function probeSignTool(env = process.env) {
  const candidates = [];
  for (const segment of (env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
    candidates.push(path.join(segment, "signtool.exe"));
  }

  for (const root of [env["ProgramFiles(x86)"], env.ProgramFiles].filter(Boolean)) {
    const kitRoot = path.join(root, "Windows Kits", "10", "bin");
    if (!existsSync(kitRoot)) continue;
    for (const version of readdirSync(kitRoot).sort().reverse()) {
      candidates.push(path.join(kitRoot, version, "x64", "signtool.exe"));
    }
  }

  const found = candidates.find((candidate) => existsSync(candidate));
  return found
    ? { available: true, path: found, sourceClassification: "windows_sdk_or_path" }
    : { available: false, path: null, sourceClassification: "missing" };
}

export function inspectDigestWithSignTool(absolutePath, options = {}) {
  if (!options.signToolPath) {
    return {
      digestAlgorithm: "unknown",
      controlledError: "signtool_missing",
    };
  }
  const output = execFileSync(options.signToolPath, ["verify", "/pa", "/all", "/v", absolutePath], {
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    digestAlgorithm: parseDigestAlgorithmFromSignToolOutput(output),
    controlledError: null,
  };
}

export function parseDigestAlgorithmFromSignToolOutput(output) {
  const sanitized = sanitizeToolText(output);
  if (/\bsha256\b/iu.test(sanitized)) return "sha256";
  if (/\bsha1\b/iu.test(sanitized)) return "sha1";
  return "unknown";
}

export function readAuthenticodeSignature(absolutePath) {
  const literalPath = String(absolutePath).replace(/'/gu, "''");
  const psScript = [
    "& {",
    "$ErrorActionPreference = 'Stop'",
    "Import-Module Microsoft.PowerShell.Security -ErrorAction Stop",
    `$sig = Get-AuthenticodeSignature -LiteralPath '${literalPath}'`,
    "$result = [pscustomobject]@{",
    "Status = [string]$sig.Status",
    "StatusMessage = [string]$sig.StatusMessage",
    "SignerSubject = if ($sig.SignerCertificate) { [string]$sig.SignerCertificate.Subject } else { $null }",
    "CertificateThumbprint = if ($sig.SignerCertificate) { [string]$sig.SignerCertificate.Thumbprint } else { $null }",
    "TimestampPresent = $null -ne $sig.TimeStamperCertificate",
    "TimestampValid = $null -ne $sig.TimeStamperCertificate",
    "}",
    "$result | ConvertTo-Json -Compress",
    "}",
  ].join("\n");
  const output = execFileSync(
    "pwsh.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psScript],
    {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return JSON.parse(output);
}

export function normalizeAuthenticodeResult(value = {}) {
  return {
    status: String(value.status ?? value.Status ?? "UnknownError"),
    signerSubject: value.signerSubject ?? value.SignerSubject ?? null,
    certificateThumbprint: value.certificateThumbprint ?? value.CertificateThumbprint ?? null,
    timestampPresent: Boolean(value.timestampPresent ?? value.TimestampPresent),
    timestampValid: Boolean(value.timestampValid ?? value.TimestampValid),
    controlledError: value.controlledError ?? null,
  };
}

export function normalizeDigestInspection(value = {}) {
  return {
    digestAlgorithm: value.digestAlgorithm ?? "unknown",
    controlledError: value.controlledError ?? null,
  };
}

export function assertReportIsSanitized(report) {
  const text = JSON.stringify(report);
  const violation = DEFAULT_FORBIDDEN_TEXT_PATTERNS.find((pattern) => pattern.test(text));
  if (violation) {
    throw new Error("Signed artifact verification report failed sanitization.");
  }
}

function requireExplicitArtifactDirectory(artifactDir) {
  if (!artifactDir) {
    throw new Error("An explicit --artifact-dir is required.");
  }
  const resolved = path.resolve(artifactDir);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    throw new Error("The explicit artifact directory does not exist.");
  }
  return resolved;
}

function walkFiles(directory) {
  const entries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      entries.push(fullPath);
    }
  }
  return entries;
}

function isPeBinary(absolutePath) {
  const extension = path.extname(absolutePath).toLowerCase();
  if (![".exe", ".dll", ".node"].includes(extension)) return false;
  const header = Buffer.alloc(2);
  const fd = openSync(absolutePath, "r");
  try {
    return readSync(fd, header, 0, 2, 0) === 2 && header[0] === 0x4d && header[1] === 0x5a;
  } finally {
    closeSync(fd);
  }
}

function normalizeArtifactRecord(root, artifact) {
  const absolutePath = typeof artifact === "string" ? artifact : artifact.absolutePath;
  const relativePath =
    typeof artifact === "string"
      ? sanitizeRelativePath(root, artifact)
      : artifact.relativePath ?? sanitizeRelativePath(root, absolutePath);
  return {
    absolutePath,
    relativePath,
    sha256: artifact.sha256,
    role: artifact.role ?? classifyArtifactRole(relativePath),
    ownership: artifact.ownership,
    size: statSync(absolutePath).size,
  };
}

function sanitizeRelativePath(root, absolutePath) {
  const relative = path.relative(root, path.resolve(absolutePath));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Artifact path must stay inside the explicit artifact directory.");
  }
  return relative.split(path.sep).join("/");
}

function sha256File(absolutePath) {
  return createHash("sha256").update(readFileSync(absolutePath)).digest("hex").toUpperCase();
}

function createExpectedSigner(options) {
  const subject = normalizeOptionalString(options.expectedSignerSubject);
  const thumbprint = normalizeThumbprint(options.expectedSignerThumbprint);
  const placeholder =
    options.allowSyntheticPlaceholder &&
    (subject === "TEST-FIXTURE-SUBJECT-NOT-PRODUCTION" ||
      thumbprint === "TESTFIXTURETHUMBPRINTNOTPRODUCTION0000000000");
  const productionReady = Boolean(subject && thumbprint && !placeholder);
  return {
    subject,
    thumbprint,
    productionReady,
    subjectClassification: subject
      ? placeholder
        ? "test_fixture_placeholder"
        : "provided"
      : "expected_subject_missing",
    thumbprintClassification: thumbprint
      ? placeholder
        ? "test_fixture_placeholder"
        : "provided"
      : "expected_thumbprint_missing",
  };
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeThumbprint(value) {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.replace(/\s+/gu, "").toUpperCase() : null;
}

function classifyArtifactRole(relativePath) {
  const basename = path.posix.basename(relativePath).toLowerCase();
  if (/setup|installer/u.test(basename) && !/__uninstaller/u.test(basename) && basename.endsWith(".exe")) {
    return "final_nsis_installer";
  }
  if (basename === "jarvis-k alpha.exe") return "main_exe";
  if (/(?:uninstall|__uninstaller)/u.test(basename) && basename.endsWith(".exe")) return "uninstaller";
  if (basename.endsWith(".node")) return "native_node";
  if (basename.endsWith(".dll")) return "dll";
  if (basename.endsWith(".exe")) return "helper_exe";
  return "pe_binary";
}

function classifyArtifactOwnership(relativePath, role) {
  if (REQUIRED_JARVIS_ROLES.includes(role)) return "jarvis_owned";
  if (
    /node_modules|electron|chrome|ffmpeg|vulkan|swiftshader|resources\/elevate\.exe/iu.test(relativePath) ||
    /(?:^|\/)(?:d3dcompiler_47|dxcompiler|dxil|libEGL|libGLESv2)\.dll$/u.test(relativePath)
  ) {
    return "upstream";
  }
  return "unknown";
}

function classifySignatureStatus(status) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "valid") return "valid";
  if (normalized === "notsigned") return "not_signed";
  if (normalized === "hashmismatch") return "hash_mismatch";
  if (normalized === "unknownerror") return "unknown_error";
  if (normalized === "nottrusted" || normalized === "nottrustedroot") return "invalid_chain";
  return "invalid";
}

function classifySubject(actual, expected) {
  if (!expected) return "expected_missing";
  if (!actual) return "missing";
  return actual.includes(expected) || actual === expected ? "exact_match" : "wrong_expected_publisher";
}

function classifyThumbprint(actual, expected) {
  if (!expected) return "expected_missing";
  const normalizedActual = normalizeThumbprint(actual);
  return normalizedActual === expected ? "exact_match" : normalizedActual ? "wrong_thumbprint" : "missing";
}

function classifyTimestamp(signature) {
  if (!signature.timestampPresent) return "absent";
  return signature.timestampValid ? "valid" : "invalid";
}

function classifyDigestAlgorithm(value) {
  const normalized = String(value ?? "unknown").toLowerCase();
  if (normalized.includes("sha256")) return "sha256";
  if (normalized.includes("sha1")) return "sha1";
  return "unknown";
}

function countRoles(artifacts) {
  return artifacts.reduce((counts, artifact) => {
    counts[artifact.role] = (counts[artifact.role] ?? 0) + 1;
    return counts;
  }, {});
}

function countClassifications(artifacts) {
  return artifacts.reduce((counts, artifact) => {
    counts[artifact.classification] = (counts[artifact.classification] ?? 0) + 1;
    return counts;
  }, {});
}

function classifyReleaseSignatureClass(input) {
  if (
    input.signatureStatus === "valid" &&
    input.signerSubjectClassification === "exact_match" &&
    input.timestampClassification === "valid" &&
    REQUIRED_JARVIS_ROLES.includes(input.role)
  ) {
    return "signed_valid_expected_publisher";
  }
  if (input.signatureStatus === "valid" && input.timestampClassification === "valid") {
    return "signed_valid_third_party";
  }
  if (input.signatureStatus === "not_signed" && input.ownership === "upstream") {
    return "unsigned_expected_with_documented_origin";
  }
  if (input.signatureStatus === "not_signed") {
    return "unsigned_unexpected";
  }
  return "invalid_signature";
}

function classifyDocumentedOrigin(relativePath, role, ownership) {
  if (ownership !== "upstream") return null;
  if (role === "helper_exe" && /resources\/elevate\.exe/iu.test(relativePath)) {
    return {
      packageOrDependency: "electron-builder nsis elevate helper",
      rationale: "packager-provided helper binary copied into win-unpacked resources",
    };
  }
  if (/(?:^|\/)(?:d3dcompiler_47|dxcompiler|dxil|ffmpeg|libEGL|libGLESv2|vk_swiftshader|vulkan-1)\.dll$/u.test(relativePath)) {
    return {
      packageOrDependency: "Electron/Chromium Windows runtime",
      rationale: "packager-provided runtime binary from Electron distribution",
    };
  }
  if (/node_modules/iu.test(relativePath)) {
    return {
      packageOrDependency: "packaged npm dependency",
      rationale: "native binary belongs to a packaged dependency and requires dependency-level review",
    };
  }
  return {
    packageOrDependency: "upstream packaged runtime",
    rationale: "non-Jarvis-owned packaged binary classified by allowlist",
  };
}

function sanitizeToolText(value) {
  return String(value ?? "")
    .replace(/[A-Z]:\\Users\\[^\\\s"']+/giu, "<USER_PATH>")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gu, "Bearer <REDACTED>")
    .slice(0, 2000);
}

function writeJsonAtomic(filePath, value) {
  const target = path.resolve(filePath);
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = path.join(
    path.dirname(target),
    `.${path.basename(target)}.${process.pid}.${Date.now()}.tmp`,
  );
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}${os.EOL}`);
  renameSync(temporary, target);
}

const invokedAsCli =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedAsCli) {
  try {
    const options = parseSignedReleaseVerificationArgs();
    const report = verifySignedReleaseArtifacts(options);
    if (options.out) {
      writeJsonAtomic(options.out, report);
    }
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.summary.status === "PASS" ? 0 : 1);
  } catch (error) {
    console.error(
      JSON.stringify({
        schemaVersion: SIGNED_RELEASE_VERIFICATION_SCHEMA_VERSION,
        status: "FAIL",
        controlledError: "signed_release_verification_failed",
        message: sanitizeToolText(error?.message ?? "unknown"),
      }),
    );
    process.exit(1);
  }
}
