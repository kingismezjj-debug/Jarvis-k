import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  CoreBrainActionExecutorPort,
  CoreBrainActionRequest,
  CoreBrainActionResult
} from "@jarvis-k/core";

export interface BrainActionAllowlistAdapterOptions {
  disabled?: boolean;
  env?: NodeJS.ProcessEnv;
  exists?: (filePath: string) => boolean;
  verifyLocalApp?: (label: string) => Promise<boolean>;
  filesystemSearchRoots?: readonly string[];
  writeNotepadText?: (text: string) => Promise<boolean>;
  controlKnownAppWindow?: (
    label: string,
    action: "focus" | "minimize" | "restore"
  ) => Promise<boolean>;
  launch?: (
    command: string,
    args: readonly string[],
    options: BrainActionLaunchOptions
  ) => Promise<void>;
}

interface BrainActionLaunchOptions {
  windowsHide: boolean;
}

interface LocalAppDefinition {
  aliases: readonly string[];
  command?: string;
  candidatePaths?: (
    env: NodeJS.ProcessEnv
  ) => readonly (string | undefined)[];
}

const allowedBrowserAliases = new Map<string, string>([
  ["github", "https://github.com"],
  ["git hub", "https://github.com"],
  ["huggingface", "https://huggingface.co"],
  ["hugging face", "https://huggingface.co"],
  ["hf", "https://huggingface.co"],
  ["chatgpt", "https://chatgpt.com"],
  ["openai", "https://openai.com"],
  ["google", "https://www.google.com"],
  ["youtube", "https://www.youtube.com"],
  ["bilibili", "https://www.bilibili.com"],
  ["baidu", "https://www.baidu.com"]
]);

const configuredBrowserAliasEnv = new Map<string, readonly string[]>([
  [
    "JARVIS_K_IZYTOKEN_ADMIN_URL",
    [
      "izytoken admin",
      "izy token admin",
      "izytoken backend",
      "izy token backend",
      "\u6253\u5f00izytoken\u540e\u53f0",
      "\u6253\u5f00izy token\u540e\u53f0",
      "\u6253\u5f00\u4e00\u53eatoken\u540e\u53f0",
      "\u6253\u5f00easy token\u540e\u53f0"
    ]
  ]
]);

const localApps: readonly LocalAppDefinition[] = [
  {
    aliases: ["notepad", "\u8bb0\u4e8b\u672c"],
    command: "notepad.exe"
  },
  {
    aliases: ["calculator", "calc", "\u8ba1\u7b97\u5668"],
    command: "calc.exe"
  },
  {
    aliases: ["paint", "mspaint", "\u753b\u56fe"],
    command: "mspaint.exe"
  },
  {
    aliases: ["chrome", "\u8c37\u6b4c\u6d4f\u89c8\u5668"],
    candidatePaths: (env) => [
      joinIfBase(env.ProgramFiles, "Google", "Chrome", "Application", "chrome.exe"),
      joinIfBase(env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe"),
      joinIfBase(env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe")
    ]
  },
  {
    aliases: ["edge", "microsoft edge", "\u6d4f\u89c8\u5668"],
    candidatePaths: (env) => [
      joinIfBase(env.ProgramFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
      joinIfBase(env["ProgramFiles(x86)"], "Microsoft", "Edge", "Application", "msedge.exe")
    ]
  },
  {
    aliases: ["vscode", "vs code", "visual studio code", "code", "\u4ee3\u7801"],
    candidatePaths: (env) => [
      joinIfBase(env.LOCALAPPDATA, "Programs", "Microsoft VS Code", "Code.exe"),
      joinIfBase(env.ProgramFiles, "Microsoft VS Code", "Code.exe"),
      joinIfBase(env["ProgramFiles(x86)"], "Microsoft VS Code", "Code.exe")
    ]
  },
  {
    aliases: ["wechat", "\u5fae\u4fe1"],
    candidatePaths: (env) => [
      joinIfBase(env.ProgramFiles, "Tencent", "WeChat", "WeChat.exe"),
      joinIfBase(env["ProgramFiles(x86)"], "Tencent", "WeChat", "WeChat.exe")
    ]
  }
];

export class BrainActionAllowlistAdapter
  implements CoreBrainActionExecutorPort
{
  private readonly disabled: boolean;
  private readonly env: NodeJS.ProcessEnv;
  private readonly exists: (filePath: string) => boolean;
  private readonly filesystemSearchRoots: readonly string[];
  private readonly verifyLocalApp: (label: string) => Promise<boolean>;
  private readonly writeNotepadTextAutomation: (text: string) => Promise<boolean>;
  private readonly controlKnownAppWindowAutomation: (
    label: string,
    action: "focus" | "minimize" | "restore"
  ) => Promise<boolean>;
  private readonly launch: (
    command: string,
    args: readonly string[],
    options: BrainActionLaunchOptions
  ) => Promise<void>;

  public constructor(options: BrainActionAllowlistAdapterOptions = {}) {
    this.disabled = options.disabled ?? false;
    this.env = options.env ?? process.env;
    this.exists = options.exists ?? existsSync;
    this.filesystemSearchRoots =
      options.filesystemSearchRoots ??
      defaultFilesystemSearchRoots(this.env, this.exists);
    this.verifyLocalApp = options.verifyLocalApp ?? defaultVerifyLocalApp;
    this.writeNotepadTextAutomation =
      options.writeNotepadText ?? defaultWriteNotepadText;
    this.controlKnownAppWindowAutomation =
      options.controlKnownAppWindow ?? defaultControlKnownAppWindow;
    this.launch = options.launch ?? defaultLaunch;
  }

  public async openBrowser(
    request: CoreBrainActionRequest
  ): Promise<CoreBrainActionResult> {
    if (this.disabled) {
      return blocked("BRAIN_ACTIONS_DISABLED", "browser");
    }
    const url = resolveBrowserUrl(request.target, this.env);
    if (url === undefined) {
      return blocked("TARGET_NOT_ALLOWLISTED", "browser");
    }
    try {
      await this.launch("explorer.exe", [url.href], { windowsHide: false });
      return completed(
        url.hostname,
        "verified",
        `${url.hostname} URL policy verified and browser launch requested.`
      );
    } catch {
      return blocked("OPEN_FAILED", url.hostname);
    }
  }

  public async openLocalApp(
    request: CoreBrainActionRequest
  ): Promise<CoreBrainActionResult> {
    if (this.disabled) {
      return blocked("BRAIN_ACTIONS_DISABLED", "app");
    }
    const app = resolveLocalApp(request.target, this.env, this.exists);
    if (app === undefined) {
      return blocked("TARGET_NOT_ALLOWLISTED", "app");
    }
    if (app.command === undefined) {
      return blocked("TARGET_UNAVAILABLE", app.label);
    }
    try {
      await this.launch(app.command, [], { windowsHide: false });
      const verified = await this.verifyLocalApp(app.label);
      return completed(
        app.label,
        verified
          ? "verified"
          : "unverified",
        verified
          ? `${app.label} process verification passed.`
          : `${app.label} process verification did not observe a running process.`
      );
    } catch {
      return blocked("OPEN_FAILED", app.label);
    }
  }

  public async searchFilesystem(
    request: CoreBrainActionRequest
  ): Promise<CoreBrainActionResult> {
    if (this.disabled) {
      return blocked("BRAIN_ACTIONS_DISABLED", "filesystem");
    }
    const query = normalizeFilesystemQuery(request.target);
    if (query === undefined) {
      return blocked("TARGET_INVALID", "filesystem");
    }
    const roots = this.filesystemSearchRoots
      .map((root) => path.resolve(root))
      .filter((root) => isAllowedFilesystemSearchRoot(root, this.env));
    if (roots.length === 0) {
      return blocked("TARGET_UNAVAILABLE", "filesystem");
    }
    try {
      const matches = await searchAllowedFilesystemRoots({
        roots,
        query,
        maxMatches: 20,
        maxDepth: 4,
        deadlineMs: 1500
      });
      const preview = matches.slice(0, 5).join(", ");
      return {
        status: "completed",
        reasonCode: "FILESYSTEM_SEARCH_COMPLETED",
        label: "filesystem",
        verificationStatus: "verified",
        verificationSummary:
          matches.length === 0
            ? "Observe-only filesystem search completed in allowed directories; 0 sanitized candidates found."
            : `Observe-only filesystem search completed in allowed directories; ${matches.length} sanitized candidate(s) found: ${preview}.`,
        matchCount: matches.length
      };
    } catch {
      return blocked("SEARCH_FAILED", "filesystem");
    }
  }

  public async writeNotepadText(
    request: CoreBrainActionRequest
  ): Promise<CoreBrainActionResult> {
    if (this.disabled) {
      return blocked("BRAIN_ACTIONS_DISABLED", "notepad");
    }
    if (normalizeTarget(request.target) !== "notepad") {
      return blocked("TARGET_NOT_ALLOWLISTED", "notepad");
    }
    const text = normalizeNotepadWriteText(request.text ?? "");
    if (text === undefined) {
      return blocked("TARGET_INVALID", "notepad");
    }
    try {
      const verified = await this.writeNotepadTextAutomation(text);
      if (!verified) {
        return {
          status: "blocked",
          reasonCode: "WRITE_FAILED",
          label: "notepad",
          verificationStatus: "verification_failed",
          verificationSummary:
            "Notepad text write verification did not observe the bounded text."
        };
      }
      return {
        status: "completed",
        reasonCode: "NOTEPAD_TEXT_WRITTEN",
        label: "notepad",
        verificationStatus: "verified",
        verificationSummary: `Notepad text write verification passed for ${text.length} character(s).`
      };
    } catch {
      return blocked("WRITE_FAILED", "notepad");
    }
  }

  public async controlKnownAppWindow(
    request: CoreBrainActionRequest
  ): Promise<CoreBrainActionResult> {
    if (this.disabled) {
      return blocked("BRAIN_ACTIONS_DISABLED", "window");
    }
    const label = normalizeKnownWindowTarget(request.target);
    const action = normalizeKnownWindowAction(request.action ?? "");
    if (label === undefined || action === undefined) {
      return blocked("TARGET_NOT_ALLOWLISTED", "window");
    }
    try {
      const verified = await this.controlKnownAppWindowAutomation(label, action);
      if (!verified) {
        return {
          status: "blocked",
          reasonCode: "WINDOW_CONTROL_FAILED",
          label,
          verificationStatus: "verification_failed",
          verificationSummary: `${label} window ${action} verification failed.`
        };
      }
      return {
        status: "completed",
        reasonCode: "WINDOW_CONTROL_COMPLETED",
        label,
        verificationStatus: "verified",
        verificationSummary: `${label} window ${action} verification passed.`
      };
    } catch {
      return blocked("WINDOW_CONTROL_FAILED", label);
    }
  }
}

function defaultFilesystemSearchRoots(
  env: NodeJS.ProcessEnv,
  exists: (filePath: string) => boolean
): readonly string[] {
  const userProfile = env.USERPROFILE ?? os.homedir();
  return [
    joinIfBase(userProfile, "Desktop"),
    joinIfBase(userProfile, "Documents"),
    joinIfBase(userProfile, "Downloads")
  ].filter((root): root is string => root !== undefined && exists(root));
}

function normalizeFilesystemQuery(query: string): string | undefined {
  const normalized = query.trim().replace(/\s+/gu, " ");
  if (
    normalized.length === 0 ||
    normalized.length > 120 ||
    /[\u0000-\u001f\u007f]/u.test(normalized) ||
    /(?:\.\.|[A-Za-z]:\\|\\\\|[\\/:*?"<>|])/u.test(normalized)
  ) {
    return undefined;
  }
  return normalized.toLowerCase();
}

function normalizeNotepadWriteText(text: string): string | undefined {
  const trimmed = text.trim();
  if (/[\u0000-\u001f\u007f]/u.test(trimmed)) {
    return undefined;
  }
  const normalized = trimmed.replace(/\s+/gu, " ");
  if (
    normalized.length === 0 ||
    normalized.length > 160 ||
    !/^[A-Za-z0-9 .,;:'"!?_-]+$/u.test(normalized)
  ) {
    return undefined;
  }
  return normalized;
}

function normalizeKnownWindowTarget(target: string): string | undefined {
  const normalized = normalizeTarget(target);
  if (
    normalized === "notepad" ||
    normalized === "calculator" ||
    normalized === "vscode"
  ) {
    return normalized;
  }
  return undefined;
}

function normalizeKnownWindowAction(
  action: string
): "focus" | "minimize" | "restore" | undefined {
  const normalized = normalizeTarget(action);
  if (
    normalized === "focus" ||
    normalized === "minimize" ||
    normalized === "restore"
  ) {
    return normalized;
  }
  return undefined;
}

function isAllowedFilesystemSearchRoot(
  candidateRoot: string,
  env: NodeJS.ProcessEnv
): boolean {
  const userProfile = path.resolve(env.USERPROFILE ?? os.homedir());
  const allowedRoots = ["Desktop", "Documents", "Downloads"].map((segment) =>
    path.resolve(userProfile, segment).toLowerCase()
  );
  const normalized = path.resolve(candidateRoot).toLowerCase();
  return allowedRoots.some((allowedRoot) => normalized === allowedRoot);
}

async function searchAllowedFilesystemRoots(input: {
  roots: readonly string[];
  query: string;
  maxMatches: number;
  maxDepth: number;
  deadlineMs: number;
}): Promise<string[]> {
  const deadline = Date.now() + input.deadlineMs;
  const matches: string[] = [];
  const seen = new Set<string>();
  const terms = input.query.split(" ").filter(Boolean);
  const visit = async (directory: string, depth: number): Promise<void> => {
    if (
      depth > input.maxDepth ||
      Date.now() >= deadline ||
      matches.length >= input.maxMatches
    ) {
      return;
    }
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (Date.now() >= deadline || matches.length >= input.maxMatches) {
        return;
      }
      if (entry.isSymbolicLink()) {
        continue;
      }
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath, depth + 1);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const normalizedName = entry.name.toLowerCase();
      if (!terms.every((term) => normalizedName.includes(term))) {
        continue;
      }
      const sanitizedName = sanitizeFilenameForEvidence(entry.name);
      if (seen.has(sanitizedName)) {
        continue;
      }
      seen.add(sanitizedName);
      matches.push(sanitizedName);
    }
  };
  for (const root of input.roots) {
    await visit(root, 0);
  }
  return matches;
}

function sanitizeFilenameForEvidence(filename: string): string {
  return filename
    .replace(/[\u0000-\u001f\u007f]/gu, "")
    .replace(/[\\/:*?"<>|]/gu, "_")
    .slice(0, 80);
}

function resolveBrowserUrl(
  target: string,
  env: NodeJS.ProcessEnv
): URL | undefined {
  const normalized = normalizeTarget(target);
  if (normalized.length === 0 || normalized.length > 300) {
    return undefined;
  }
  const alias = allowedBrowserAliases.get(normalized);
  const configuredAlias = resolveConfiguredBrowserAlias(normalized, env);
  const candidate = alias ?? configuredAlias ?? normalizeUrlText(target);
  if (candidate === undefined) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return undefined;
  }
  if (url.username.length > 0 || url.password.length > 0) {
    return undefined;
  }
  if (url.href.length > 300 || /[\u0000-\u001f\u007f]/u.test(url.href)) {
    return undefined;
  }
  if (url.protocol === "https:") {
    return url;
  }
  const localhostHttpAllowed =
    env.JARVIS_K_BROWSER_OPEN_ALLOW_LOCALHOST_HTTP === "1";
  if (
    url.protocol === "http:" &&
    localhostHttpAllowed &&
    isLocalhostHost(url.hostname)
  ) {
    return url;
  }
  return undefined;
}

function resolveConfiguredBrowserAlias(
  normalizedTarget: string,
  env: NodeJS.ProcessEnv
): string | undefined {
  for (const [envKey, aliases] of configuredBrowserAliasEnv) {
    if (
      aliases.some((alias) => normalizeTarget(alias) === normalizedTarget) &&
      typeof env[envKey] === "string"
    ) {
      return env[envKey];
    }
  }
  return undefined;
}

function isLocalhostHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
}

function normalizeUrlText(target: string): string | undefined {
  const trimmed = target.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > 300 ||
    /[\u0000-\u001f\u007f]/u.test(trimmed) ||
    /^(?:file|javascript|data|powershell|cmd):/iu.test(trimmed)
  ) {
    return undefined;
  }
  if (/^https?:\/\//iu.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/iu.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return undefined;
}

function resolveLocalApp(
  target: string,
  env: NodeJS.ProcessEnv,
  exists: (filePath: string) => boolean
): { label: string; command?: string } | undefined {
  const normalized = normalizeTarget(target);
  const app = localApps.find((definition) =>
    definition.aliases.some((alias) => normalizeTarget(alias) === normalized)
  );
  if (app === undefined) {
    return undefined;
  }
  if (app.command !== undefined) {
    return { label: app.aliases[0] ?? normalized, command: app.command };
  }
  const command = app
    .candidatePaths?.(env)
    .filter((candidate): candidate is string => candidate !== undefined)
    .find((candidate) => isAllowedExecutablePath(candidate, exists));
  return {
    label: app.aliases[0] ?? normalized,
    ...(command === undefined ? {} : { command })
  };
}

function isAllowedExecutablePath(
  candidate: string,
  exists: (filePath: string) => boolean
): boolean {
  const resolved = path.resolve(candidate);
  return (
    resolved.toLowerCase().endsWith(".exe") &&
    !/[;&|<>]/u.test(resolved) &&
    exists(resolved)
  );
}

function normalizeTarget(target: string): string {
  return target
    .trim()
    .replace(/\b(?:v\s*[\.\s]*s\s*[\.\s]*code|vs\s*[\.\s]*code)\b/giu, "vscode")
    .replace(/\s+/gu, " ")
    .toLowerCase();
}

function joinIfBase(
  base: string | undefined,
  ...segments: string[]
): string | undefined {
  if (base === undefined || base.trim().length === 0) {
    return undefined;
  }
  return path.join(base, ...segments);
}

function completed(
  label: string,
  verificationStatus: CoreBrainActionResult["verificationStatus"] =
    "not_applicable",
  verificationSummary = `${label} action completed.`
): CoreBrainActionResult {
  return {
    status: "completed",
    reasonCode: "ALLOWLISTED_TARGET_OPENED",
    label,
    verificationStatus,
    verificationSummary
  };
}

function blocked(
  reasonCode: CoreBrainActionResult["reasonCode"],
  label: string
): CoreBrainActionResult {
  return {
    status: "blocked",
    reasonCode,
    label
  };
}

function defaultLaunch(
  command: string,
  args: readonly string[],
  options: BrainActionLaunchOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      detached: true,
      env: createExternalGuiLaunchEnvironment(process.env),
      shell: false,
      stdio: "ignore",
      windowsHide: options.windowsHide
    });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

export function createExternalGuiLaunchEnvironment(
  env: NodeJS.ProcessEnv
): NodeJS.ProcessEnv {
  const launchEnv = { ...env };
  delete launchEnv.ELECTRON_RUN_AS_NODE;
  return launchEnv;
}

function defaultWriteNotepadText(text: string): Promise<boolean> {
  const script = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class JarvisKNotepadApi {
  [DllImport("user32.dll")]
  public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowTitle);
  [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, string lParam);
  [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, System.Text.StringBuilder lParam);
}
"@
function Get-NotepadCandidate {
  Get-Process -Name 'notepad' -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 } |
    Sort-Object StartTime -Descending |
    Select-Object -First 1
}
function Wait-NotepadCandidate {
  param([int]$TimeoutMs)
  $deadline = (Get-Date).AddMilliseconds($TimeoutMs)
  $candidate = $null
  do {
    $candidate = Get-NotepadCandidate
    if ($null -eq $candidate) {
      Start-Sleep -Milliseconds 100
    }
  } while ($null -eq $candidate -and (Get-Date) -lt $deadline)
  $candidate
}
function Find-TextElement {
  param([IntPtr]$WindowHandle)
  $root = [System.Windows.Automation.AutomationElement]::FromHandle($WindowHandle)
  if ($null -eq $root) { return $null }
  $documentCondition = New-Object -TypeName System.Windows.Automation.PropertyCondition -ArgumentList @(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Document
  )
  $editCondition = New-Object -TypeName System.Windows.Automation.PropertyCondition -ArgumentList @(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Edit
  )
  $element = $root.FindFirst(
    [System.Windows.Automation.TreeScope]::Descendants,
    $documentCondition
  )
  if ($null -ne $element) { return $element }
  $root.FindFirst(
    [System.Windows.Automation.TreeScope]::Descendants,
    $editCondition
  )
}
function Read-TextElement {
  param($Element)
  if ($null -eq $Element) { return '' }
  try {
    $textPattern = $Element.GetCurrentPattern(
      [System.Windows.Automation.TextPattern]::Pattern
    )
    if ($null -ne $textPattern) {
      return $textPattern.DocumentRange.GetText(10000)
    }
  } catch {}
  try {
    $valuePattern = $Element.GetCurrentPattern(
      [System.Windows.Automation.ValuePattern]::Pattern
    )
    if ($null -ne $valuePattern) {
      return $valuePattern.Current.Value
    }
  } catch {}
  ''
}
function Try-SetTextElement {
  param($Element, [string]$Value)
  if ($null -eq $Element) { return $false }
  try {
    $valuePattern = $Element.GetCurrentPattern(
      [System.Windows.Automation.ValuePattern]::Pattern
    )
    if ($null -ne $valuePattern -and -not $valuePattern.Current.IsReadOnly) {
      $valuePattern.SetValue($Value)
      return $true
    }
  } catch {}
  $false
}
function Read-Win32EditText {
  param([IntPtr]$EditHandle)
  if ($EditHandle -eq [IntPtr]::Zero) { return '' }
  $WM_GETTEXTLENGTH = 0x000E
  $WM_GETTEXT = 0x000D
  $length = [int][JarvisKNotepadApi]::SendMessage(
    $EditHandle,
    $WM_GETTEXTLENGTH,
    [IntPtr]::Zero,
    [NullString]::Value
  )
  $builder = New-Object System.Text.StringBuilder ($length + 1)
  [JarvisKNotepadApi]::SendMessage(
    $EditHandle,
    $WM_GETTEXT,
    [IntPtr]($builder.Capacity),
    $builder
  ) | Out-Null
  $builder.ToString()
}
function Try-SetWin32EditText {
  param([IntPtr]$WindowHandle, [string]$Value)
  $editHandle = [JarvisKNotepadApi]::FindWindowEx(
    $WindowHandle,
    [IntPtr]::Zero,
    'Edit',
    [NullString]::Value
  )
  if ($editHandle -eq [IntPtr]::Zero) { return $false }
  $WM_SETTEXT = 0x000C
  $existingText = Read-Win32EditText -EditHandle $editHandle
  $nextText = if ($existingText.Contains($Value)) { $existingText } else { $existingText + $Value }
  [JarvisKNotepadApi]::SendMessage(
    $editHandle,
    $WM_SETTEXT,
    [IntPtr]::Zero,
    $nextText
  ) | Out-Null
  Start-Sleep -Milliseconds 150
  $verifiedText = Read-Win32EditText -EditHandle $editHandle
  $verifiedText.Contains($Value)
}
function Escape-SendKeysText {
  param([string]$Value)
  $result = New-Object System.Text.StringBuilder
  foreach ($char in $Value.ToCharArray()) {
    switch ($char) {
      '+' { [void]$result.Append('{+}') }
      '^' { [void]$result.Append('{^}') }
      '%' { [void]$result.Append('{%}') }
      '~' { [void]$result.Append('{~}') }
      '(' { [void]$result.Append('{(}') }
      ')' { [void]$result.Append('{)}') }
      '[' { [void]$result.Append('{[}') }
      ']' { [void]$result.Append('{]}') }
      default { [void]$result.Append($char) }
    }
  }
  $result.ToString()
}
$requestedText = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($requestedText)) {
  '{"verified":false}'
  exit 0
}
$candidate = Wait-NotepadCandidate -TimeoutMs 1000
if ($null -eq $candidate) {
  Start-Process -FilePath 'notepad.exe' | Out-Null
  $candidate = Wait-NotepadCandidate -TimeoutMs 5000
}
if ($null -eq $candidate) {
  '{"verified":false}'
  exit 0
}
$hwnd = [IntPtr]$candidate.MainWindowHandle
[JarvisKNotepadApi]::ShowWindowAsync($hwnd, 9) | Out-Null
Start-Sleep -Milliseconds 150
[JarvisKNotepadApi]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 250
$setByAutomation = Try-SetWin32EditText -WindowHandle $hwnd -Value $requestedText
if (-not $setByAutomation) {
  $element = Find-TextElement -WindowHandle $hwnd
  $currentText = Read-TextElement -Element $element
  if ($currentText.Trim().Length -eq 0) {
    $setByAutomation = Try-SetTextElement -Element $element -Value $requestedText
  }
}
if (-not $setByAutomation) {
  [System.Windows.Forms.SendKeys]::SendWait((Escape-SendKeysText $requestedText))
  Start-Sleep -Milliseconds 350
  $element = Find-TextElement -WindowHandle $hwnd
  $currentText = Read-TextElement -Element $element
  $setByAutomation = $currentText.Contains($requestedText)
}
if ($setByAutomation) {
  '{"verified":true}'
} else {
  '{"verified":false}'
}
`;
  const encodedCommand = Buffer.from(script, "utf16le").toString("base64");
  return new Promise((resolve) => {
    let settled = false;
    let stdout = "";
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-EncodedCommand", encodedCommand],
      {
        shell: false,
        windowsHide: true,
        stdio: ["pipe", "pipe", "ignore"]
      }
    );
    const finish = (verified: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(verified);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(false);
    }, 8000);
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.once("error", () => finish(false));
    child.once("close", () => {
      finish(/"verified"\s*:\s*true/iu.test(stdout));
    });
    child.stdin?.end(text);
  });
}

function defaultControlKnownAppWindow(
  label: string,
  action: "focus" | "minimize" | "restore"
): Promise<boolean> {
  const imageName = localAppProcessImage(label);
  if (imageName === undefined) {
    return Promise.resolve(false);
  }
  const processName = imageName.replace(/\.exe$/iu, "");
  const script = `
$ErrorActionPreference = 'Stop'
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class JarvisKWindowApi {
  [DllImport("user32.dll")]
  public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")]
  public static extern bool IsIconic(IntPtr hWnd);
}
"@
$processName = $env:JARVIS_K_WINDOW_APP_PROCESS
$action = $env:JARVIS_K_WINDOW_ACTION
if ([string]::IsNullOrWhiteSpace($processName) -or [string]::IsNullOrWhiteSpace($action)) {
  '{"verified":false}'
  exit 0
}
$deadline = (Get-Date).AddSeconds(5)
$candidate = $null
do {
  $candidate = Get-Process -Name $processName -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 } |
    Select-Object -First 1
  if ($null -eq $candidate) {
    Start-Sleep -Milliseconds 100
  }
} while ($null -eq $candidate -and (Get-Date) -lt $deadline)
if ($null -eq $candidate) {
  '{"verified":false}'
  exit 0
}
$hwnd = [IntPtr]$candidate.MainWindowHandle
switch ($action) {
  'focus' {
    [JarvisKWindowApi]::ShowWindowAsync($hwnd, 9) | Out-Null
    Start-Sleep -Milliseconds 100
    [JarvisKWindowApi]::SetForegroundWindow($hwnd) | Out-Null
    Start-Sleep -Milliseconds 250
    $verified = -not [JarvisKWindowApi]::IsIconic($hwnd)
  }
  'minimize' {
    [JarvisKWindowApi]::ShowWindowAsync($hwnd, 6) | Out-Null
    Start-Sleep -Milliseconds 300
    $verified = [JarvisKWindowApi]::IsIconic($hwnd)
  }
  'restore' {
    [JarvisKWindowApi]::ShowWindowAsync($hwnd, 9) | Out-Null
    Start-Sleep -Milliseconds 300
    $verified = -not [JarvisKWindowApi]::IsIconic($hwnd)
  }
  default {
    $verified = $false
  }
}
if ($verified) { '{"verified":true}' } else { '{"verified":false}' }
`;
  const encodedCommand = Buffer.from(script, "utf16le").toString("base64");
  return new Promise((resolve) => {
    let settled = false;
    let stdout = "";
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-EncodedCommand", encodedCommand],
      {
        env: {
          ...process.env,
          JARVIS_K_WINDOW_APP_PROCESS: processName,
          JARVIS_K_WINDOW_ACTION: action
        },
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"]
      }
    );
    const finish = (verified: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(verified);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(false);
    }, 7000);
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.once("error", () => finish(false));
    child.once("close", () => {
      finish(/"verified"\s*:\s*true/iu.test(stdout));
    });
  });
}

function defaultVerifyLocalApp(label: string): Promise<boolean> {
  const imageName = localAppProcessImage(label);
  if (imageName === undefined) {
    return Promise.resolve(false);
  }
  if (label === "vscode") {
    return defaultVerifyVsCode();
  }
  return verifyProcessImageByTasklist(imageName, 3000);
}

function verifyProcessImageByTasklist(
  imageName: string,
  timeoutMs: number
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const attempt = () => {
      let settled = false;
      const child = spawn(
        "tasklist.exe",
        ["/FI", `IMAGENAME eq ${imageName}`, "/NH"],
        {
          shell: false,
          windowsHide: true,
          stdio: ["ignore", "pipe", "ignore"]
        }
      );
      const finish = (verified: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        if (verified || Date.now() >= deadline) {
          resolve(verified);
          return;
        }
        setTimeout(attempt, 150);
      };
      const timer = setTimeout(() => {
        child.kill();
        finish(false);
      }, 700);
      let output = "";
      child.stdout?.on("data", (chunk: Buffer) => {
        output += chunk.toString("utf8");
      });
      child.once("error", () => finish(false));
      child.once("close", () => {
        finish(output.toLowerCase().includes(imageName.toLowerCase()));
      });
    };
    attempt();
  });
}

async function defaultVerifyVsCode(): Promise<boolean> {
  if (await verifyProcessImageByTasklist("Code.exe", 45_000)) {
    return true;
  }
  return verifyVsCodeProcess(5_000);
}

function verifyVsCodeProcess(timeoutMs: number): Promise<boolean> {
  const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const script = `
$ErrorActionPreference = 'Stop'
$deadline = (Get-Date).AddSeconds(${timeoutSeconds})
do {
  $candidate = Get-Process -Name 'Code' -ErrorAction SilentlyContinue |
    Where-Object { $_.Id -gt 0 } |
    Select-Object -First 1
  if ($null -ne $candidate) {
    '{"verified":true}'
    exit 0
  }
  Start-Sleep -Milliseconds 250
} while ((Get-Date) -lt $deadline)
'{"verified":false}'
`;
  const encodedCommand = Buffer.from(script, "utf16le").toString("base64");
  return new Promise((resolve) => {
    let settled = false;
    let stdout = "";
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-EncodedCommand", encodedCommand],
      {
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"]
      }
    );
    const finish = (verified: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(verified);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(false);
    }, timeoutMs + 1_000);
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.once("error", () => finish(false));
    child.once("close", () => {
      finish(/"verified"\s*:\s*true/iu.test(stdout));
    });
  });
}

function localAppProcessImage(label: string): string | undefined {
  if (label === "notepad") {
    return "notepad.exe";
  }
  if (label === "calculator") {
    return "CalculatorApp.exe";
  }
  if (label === "vscode") {
    return "Code.exe";
  }
  return undefined;
}
