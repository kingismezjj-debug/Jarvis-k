import {
  buildCapabilitySnapshot,
  type CapabilityProvider
} from "@jarvis-k/capabilities";
import {
  DeviceCapabilitySchema,
  type AccelerationBackend,
  type CapabilitySnapshot,
  type GpuDevice
} from "@jarvis-k/contracts";
import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface Win32VideoController {
  Name?: string;
  AdapterRAM?: number;
  DriverVersion?: string;
}

export class NodeDeviceCapabilityProvider implements CapabilityProvider {
  public async inspect(): Promise<CapabilitySnapshot> {
    const checkedAt = new Date().toISOString();
    const gpus = await detectGpus();
    const accelerationBackends = detectAccelerationBackends(gpus);
    const platform = normalizePlatform(process.platform);

    const device = DeviceCapabilitySchema.parse({
      checkedAt,
      platform,
      arch: process.arch,
      cpuLogicalCores: Math.max(1, os.cpus().length),
      totalMemoryBytes: os.totalmem(),
      availableMemoryBytes: os.freemem(),
      gpus,
      accelerationBackends,
      recommendedMode: "lite",
      reasons: buildReasons(os.totalmem(), gpus, accelerationBackends)
    });

    return buildCapabilitySnapshot({
      checkedAt,
      device
    });
  }
}

async function detectGpus(): Promise<GpuDevice[]> {
  if (process.platform !== "win32") {
    return [];
  }

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        [
          "$ErrorActionPreference = 'Stop'",
          "Get-CimInstance Win32_VideoController |",
          "Select-Object Name, AdapterRAM, DriverVersion |",
          "ConvertTo-Json -Compress"
        ].join(" ")
      ],
      {
        timeout: 2_000,
        windowsHide: true,
        maxBuffer: 1024 * 1024
      }
    );
    const parsed = JSON.parse(stdout.trim()) as
      | Win32VideoController
      | Win32VideoController[];
    const controllers = Array.isArray(parsed) ? parsed : [parsed];
    return controllers
      .map(normalizeGpu)
      .filter((gpu): gpu is GpuDevice => gpu !== null);
  } catch {
    return [];
  }
}

function normalizeGpu(controller: Win32VideoController): GpuDevice | null {
  const name = controller.Name?.trim();
  if (!name) {
    return null;
  }
  const adapterRam = Number(controller.AdapterRAM ?? 0);
  return {
    name,
    vendor: detectGpuVendor(name),
    ...(Number.isFinite(adapterRam) && adapterRam > 0
      ? { dedicatedMemoryBytes: adapterRam }
      : {}),
    ...(controller.DriverVersion
      ? { driverVersion: controller.DriverVersion }
      : {})
  };
}

function detectGpuVendor(name: string): GpuDevice["vendor"] {
  const normalized = name.toLowerCase();
  if (normalized.includes("nvidia")) return "nvidia";
  if (normalized.includes("amd") || normalized.includes("radeon")) {
    return "amd";
  }
  if (normalized.includes("intel")) return "intel";
  if (normalized.includes("microsoft")) return "microsoft";
  return "unknown";
}

function detectAccelerationBackends(
  gpus: GpuDevice[]
): AccelerationBackend[] {
  const backends = new Set<AccelerationBackend>(["cpu"]);
  if (gpus.some((gpu) => gpu.vendor === "nvidia")) {
    backends.add("cuda");
  }
  if (process.platform === "win32") {
    backends.add("directml");
    backends.add("onnxruntime");
  }
  return Array.from(backends);
}

function normalizePlatform(
  platform: NodeJS.Platform
): "win32" | "darwin" | "linux" | "unknown" {
  if (platform === "win32" || platform === "darwin" || platform === "linux") {
    return platform;
  }
  return "unknown";
}

function buildReasons(
  totalMemoryBytes: number,
  gpus: GpuDevice[],
  accelerationBackends: AccelerationBackend[]
): string[] {
  const gib = 1024 * 1024 * 1024;
  const bestVramBytes = Math.max(
    0,
    ...gpus.map((gpu) => gpu.dedicatedMemoryBytes ?? 0)
  );
  const reasons = [
    `System memory: ${Math.round(totalMemoryBytes / gib)} GiB.`,
    `Detected GPU count: ${gpus.length}.`,
    `Acceleration backends: ${accelerationBackends.join(", ")}.`
  ];
  if (bestVramBytes > 0) {
    reasons.push(`Best reported dedicated VRAM: ${Math.round(bestVramBytes / gib)} GiB.`);
  }
  return reasons;
}
