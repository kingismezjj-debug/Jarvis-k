import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SecureVoiceProviderStore,
  type SecureStringEncryption,
} from "../src/secure-voice-provider-store";
import {
  applyDesktopStorageProfile,
  createCoreHostStorageEnvironment,
  createDesktopStorageProfile,
  type ElectronAppStoragePort,
} from "../src/storage/storage-profile";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

function createApp(input: {
  isPackaged?: boolean;
  appData?: string;
  userData?: string;
} = {}): ElectronAppStoragePort & {
  setPath: ReturnType<typeof vi.fn>;
  setName: ReturnType<typeof vi.fn>;
  setAppUserModelId: ReturnType<typeof vi.fn>;
} {
  return {
    isPackaged: input.isPackaged ?? false,
    getPath: (name) =>
      name === "appData"
        ? (input.appData ?? path.join("C:", "Users", "tester", "AppData", "Roaming"))
        : (input.userData ?? path.join("C:", "Users", "tester", "AppData", "Roaming", "Jarvis-K")),
    setPath: vi.fn(),
    setName: vi.fn(),
    setAppUserModelId: vi.fn(),
  };
}

function fakeEncryption(): SecureStringEncryption {
  return {
    isAvailable: () => true,
    encrypt: (value) => Buffer.from(`protected:${value}`, "utf8"),
    decrypt: (value) => value.toString("utf8").replace(/^protected:/, ""),
  };
}

async function createTemporaryRoot(prefix: string): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

describe("Desktop storage profile", () => {
  it("keeps development on the existing Jarvis-K namespace", () => {
    const profile = createDesktopStorageProfile({
      app: createApp(),
      env: {
        LOCALAPPDATA: path.join("C:", "Users", "tester", "AppData", "Local"),
      },
      cwd: path.join("C:", "work", "Jarvis-k"),
      installDirectory: path.join("C:", "Program Files", "Jarvis-K"),
    });

    expect(profile).toMatchObject({
      releaseChannel: "development",
      productName: "Jarvis-K",
      appId: "com.jarvis-k.desktop.development",
    });
    expect(profile.userDataPath).toContain("Jarvis-K");
    expect(profile.localDataPath).toContain("Jarvis-K");
    expect(profile.petSkinRootPath).toContain("Jarvis-K");
    expect(profile.petSkinRegistryPath).toContain("Jarvis-K");
    expect(profile.userDataPath).not.toContain("Jarvis-K-Alpha");
    expect(profile.localDataPath).not.toContain("Jarvis-K-Alpha");
    expect(profile.petSkinRootPath).not.toContain("Jarvis-K-Alpha");
  });

  it("uses an isolated packaged Alpha identity and namespace", () => {
    const app = createApp({ isPackaged: true });
    const profile = createDesktopStorageProfile({
      app,
      env: {
        LOCALAPPDATA: path.join("C:", "Users", "tester", "AppData", "Local"),
      },
      cwd: path.join("C:", "work", "Jarvis-k"),
      installDirectory: path.join("C:", "Users", "tester", "AppData", "Local", "Programs", "Jarvis-K Alpha"),
    });

    expect(profile).toMatchObject({
      releaseChannel: "alpha",
      productName: "Jarvis-K Alpha",
      appId: "com.jarvis-k.desktop.alpha",
      appUserModelId: "com.jarvis-k.desktop.alpha",
    });
    expect(profile.userDataPath).toContain("Jarvis-K-Alpha");
    expect(profile.localDataPath).toContain("Jarvis-K-Alpha");
    expect(profile.memoryDatabasePath).toContain("Jarvis-K-Alpha");
    expect(profile.taskDatabasePath).toContain("Jarvis-K-Alpha");
    expect(profile.modelDirectoryPath).toContain("Jarvis-K-Alpha");
    expect(profile.petSkinRootPath).toContain(
      path.join("Jarvis-K-Alpha", "pet-skins", "v1"),
    );
    expect(profile.petSkinRegistryPath).toContain(
      path.join("Jarvis-K-Alpha", "pet-skins", "v1", "registry.json"),
    );

    applyDesktopStorageProfile(app, profile);
    expect(app.setName).toHaveBeenCalledWith("Jarvis-K Alpha");
    expect(app.setPath).toHaveBeenCalledWith("userData", profile.userDataPath);
    expect(app.setAppUserModelId).toHaveBeenCalledWith(
      "com.jarvis-k.desktop.alpha",
    );
  });

  it("uses a test namespace for test processes", () => {
    const profile = createDesktopStorageProfile({
      app: createApp({ isPackaged: true }),
      env: {
        NODE_ENV: "test",
        LOCALAPPDATA: path.join("C:", "Users", "tester", "AppData", "Local"),
      },
      cwd: path.join("C:", "work", "Jarvis-k"),
    });

    expect(profile.releaseChannel).toBe("test");
    expect(profile.userDataPath).toContain("Jarvis-K-Test");
    expect(profile.localDataPath).toContain("Jarvis-K-Test");
    expect(profile.petSkinRootPath).toContain("Jarvis-K-Test");
  });

  it("creates a complete Core Host storage environment", () => {
    const profile = createDesktopStorageProfile({
      app: createApp({ isPackaged: true }),
      env: {
        LOCALAPPDATA: path.join("C:", "Users", "tester", "AppData", "Local"),
      },
      cwd: path.join("C:", "work", "Jarvis-k"),
    });
    const env = createCoreHostStorageEnvironment(profile);

    expect(env).toMatchObject({
      JARVIS_K_RELEASE_CHANNEL: "alpha",
      JARVIS_K_USER_DATA_PATH: profile.userDataPath,
      JARVIS_K_LOCAL_DATA_PATH: profile.localDataPath,
      JARVIS_K_MEMORY_DB_PATH: profile.memoryDatabasePath,
      JARVIS_K_TASK_DB_PATH: profile.taskDatabasePath,
      JARVIS_K_MODEL_DIR: profile.modelDirectoryPath,
      JARVIS_K_QWEN_RETAINED_SESSION_MARKER_PATH:
        profile.qwenRetainedSessionMarkerPath,
    });
    expect(JSON.stringify(env)).toContain("Jarvis-K-Alpha");
  });

  it("rejects unsafe storage overrides", () => {
    const app = createApp();
    const cwd = path.join("C:", "work", "Jarvis-k");
    expect(() =>
      createDesktopStorageProfile({
        app,
        env: { JARVIS_K_USER_DATA_PATH: "relative-path" },
        cwd,
      }),
    ).toThrow("absolute");
    expect(() =>
      createDesktopStorageProfile({
        app,
        env: { JARVIS_K_USER_DATA_PATH: path.join(cwd, "profile") },
        cwd,
      }),
    ).toThrow("project directory");
    expect(() =>
      createDesktopStorageProfile({
        app,
        env: {
          JARVIS_K_USER_DATA_PATH: path.join(
            "C:",
            "Users",
            "tester",
            "Documents",
            "Jarvis-K",
          ),
        },
        cwd,
      }),
    ).toThrow("public user folders");
  });

  it("does not allow packaged Alpha to use path overrides", () => {
    expect(() =>
      createDesktopStorageProfile({
        app: createApp({ isPackaged: true }),
        env: {
          JARVIS_K_USER_DATA_PATH: path.join("C:", "Temp", "Jarvis-K-Alpha"),
        },
        cwd: path.join("C:", "work", "Jarvis-k"),
      }),
    ).toThrow("only allowed in development or test");
  });

  it("keeps Alpha secure provider state isolated from development", async () => {
    const root = await createTemporaryRoot("jarvis-k-storage-profile-");
    const appData = path.join(root, "Roaming");
    const localAppData = path.join(root, "Local");
    const devProfile = createDesktopStorageProfile({
      app: createApp({ appData }),
      env: { LOCALAPPDATA: localAppData },
      cwd: path.join("C:", "work", "Jarvis-k"),
    });
    const alphaProfile = createDesktopStorageProfile({
      app: createApp({ appData, isPackaged: true }),
      env: { LOCALAPPDATA: localAppData },
      cwd: path.join("C:", "work", "Jarvis-k"),
    });
    const encryption = fakeEncryption();
    const devStore = new SecureVoiceProviderStore(
      path.join(devProfile.userDataPath, "jarvis-k-voice-provider.json"),
      encryption,
    );
    const alphaStore = new SecureVoiceProviderStore(
      path.join(alphaProfile.userDataPath, "jarvis-k-voice-provider.json"),
      encryption,
    );

    await devStore.save({
      provider: "volcengine",
      language: "zh",
      credentials: {
        apiKey: "not-a-credential-development-only",
        resourceId: "volc.seedasr.sauc.duration",
      },
    });

    await expect(devStore.status()).resolves.toMatchObject({
      configured: true,
      provider: "volcengine",
    });
    await expect(alphaStore.status()).resolves.toEqual({
      configured: false,
      secureStorageAvailable: true,
    });
    expect(devProfile.userDataPath).not.toBe(alphaProfile.userDataPath);
    expect(devProfile.userDataPath).not.toContain("Jarvis-K-Alpha");
    expect(alphaProfile.userDataPath).toContain("Jarvis-K-Alpha");
  });
});
