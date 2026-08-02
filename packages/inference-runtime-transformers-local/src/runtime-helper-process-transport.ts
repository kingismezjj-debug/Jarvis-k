import {
  spawn,
  type ChildProcessWithoutNullStreams
} from "node:child_process";
import type { RuntimeHelperTransport } from "./runtime-helper-client";
import type { RuntimeHelperRequest } from "./runtime-helper-protocol";

export interface RuntimeHelperProcessLaunchOptions {
  command: string;
  args?: readonly string[];
  cwd?: string;
  env?: Readonly<Record<string, string | undefined>>;
  maxLineBytes?: number;
}

const DEFAULT_MAX_LINE_BYTES = 4 * 1024 * 1024;

export class RuntimeHelperProcessTransport
  implements RuntimeHelperTransport
{
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly messageListeners = new Set<
    (message: unknown) => void
  >();
  private readonly exitListeners = new Set<() => void>();
  private readonly maxLineBytes: number;
  private stdoutBuffer = "";
  private connectedState = true;
  private exitNotified = false;

  public constructor(options: RuntimeHelperProcessLaunchOptions) {
    this.maxLineBytes = options.maxLineBytes ?? DEFAULT_MAX_LINE_BYTES;
    if (
      !Number.isInteger(this.maxLineBytes) ||
      this.maxLineBytes < 1024 ||
      this.maxLineBytes > 16 * 1024 * 1024
    ) {
      throw new Error("HELPER_TRANSPORT_LIMIT_INVALID");
    }

    const env: NodeJS.ProcessEnv = {
      PYTHONIOENCODING: "utf-8",
      PYTHONUNBUFFERED: "1"
    };
    for (const [key, value] of Object.entries(options.env ?? {})) {
      if (value !== undefined) {
        env[key] = value;
      }
    }

    this.child = spawn(options.command, [...(options.args ?? [])], {
      cwd: options.cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
      windowsHide: true
    });

    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk: string) => {
      this.handleStdout(chunk);
    });
    this.child.stderr.on("data", () => {
      // Drain helper diagnostics without forwarding raw runtime output.
    });
    this.child.on("error", () => {
      this.notifyExit();
    });
    this.child.on("exit", () => {
      this.notifyExit();
    });
  }

  public get connected(): boolean {
    return this.connectedState;
  }

  public get pid(): number | undefined {
    return this.child.pid;
  }

  public send(
    request: RuntimeHelperRequest,
    callback: (error: Error | null) => void
  ): void {
    if (!this.connectedState || this.child.stdin.destroyed) {
      callback(new Error("HELPER_UNAVAILABLE"));
      return;
    }

    let serialized: string;
    try {
      serialized = `${JSON.stringify(request)}\n`;
    } catch {
      callback(new Error("HELPER_PROTOCOL_INVALID"));
      return;
    }

    try {
      this.child.stdin.write(serialized, "utf8", (error) => {
        callback(error ? new Error("HELPER_INTERNAL") : null);
      });
    } catch {
      callback(new Error("HELPER_INTERNAL"));
    }
  }

  public onMessage(listener: (message: unknown) => void): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  public onExit(listener: () => void): () => void {
    this.exitListeners.add(listener);
    return () => {
      this.exitListeners.delete(listener);
    };
  }

  public close(): void {
    if (!this.connectedState) {
      return;
    }
    this.connectedState = false;
    this.child.stdin.destroy();
    if (!this.child.killed) {
      this.child.kill();
    }
  }

  private handleStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    if (Buffer.byteLength(this.stdoutBuffer, "utf8") > this.maxLineBytes) {
      this.stdoutBuffer = "";
      this.emitMessage(undefined);
      return;
    }

    let newlineIndex = this.stdoutBuffer.indexOf("\n");
    while (newlineIndex >= 0) {
      const line = this.stdoutBuffer.slice(0, newlineIndex).replace(/\r$/u, "");
      this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);
      if (line.length > 0) {
        this.emitMessage(parseJsonLine(line));
      }
      newlineIndex = this.stdoutBuffer.indexOf("\n");
    }
  }

  private emitMessage(message: unknown): void {
    for (const listener of this.messageListeners) {
      listener(message);
    }
  }

  private notifyExit(): void {
    if (this.exitNotified) {
      return;
    }
    this.exitNotified = true;
    this.connectedState = false;
    for (const listener of this.exitListeners) {
      listener();
    }
  }
}

export interface TransformersLocalRuntimeProcessOptions {
  pythonExecutable: string;
  helperScript: string;
  modelDirectory?: string;
  cwd?: string;
}

export function createTransformersLocalRuntimeProcessTransport(
  options: TransformersLocalRuntimeProcessOptions
): RuntimeHelperProcessTransport {
  const env: Record<string, string | undefined> = {};
  env.HF_HUB_OFFLINE = "1";
  env.TRANSFORMERS_OFFLINE = "1";
  if (options.modelDirectory !== undefined) {
    env.JARVIS_K_TRANSFORMERS_MODEL_DIR = options.modelDirectory;
  }

  const launchOptions: RuntimeHelperProcessLaunchOptions = {
    command: options.pythonExecutable,
    args: ["-u", options.helperScript],
    env
  };
  if (options.cwd !== undefined) {
    launchOptions.cwd = options.cwd;
  }

  return new RuntimeHelperProcessTransport(launchOptions);
}

function parseJsonLine(line: string): unknown {
  try {
    return JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
}
