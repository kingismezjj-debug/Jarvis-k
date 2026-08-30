import { describe, expect, it } from "vitest";
import type { MemoryAlphaStatus } from "@jarvis-k/contracts";

import { buildSettingsV2MemoryPrivacyProductViewModel } from "../src/features/settings-v2/settings-v2-memory-view-model";

const baseMemoryAlphaStatus: MemoryAlphaStatus = {
  state: "disabled",
  enabled: false,
  retentionScope: "new_accepted_user_messages",
  maxMessageCount: 5,
  trackedMessageCount: 0,
  rollbackStatus: "not_started",
  rollbackDeletedCount: 0,
  reasonCodes: [],
};

describe("Settings V2 Memory & Privacy product view model", () => {
  it("maps active personal memory only from active enabled status", () => {
    const viewModel = buildSettingsV2MemoryPrivacyProductViewModel({
      locale: "en",
      memoryAlphaStatus: {
        ...baseMemoryAlphaStatus,
        state: "active",
        enabled: true,
      },
    });

    expect(viewModel.personalMemory.value).toBe("Available");
    expect(viewModel.personalMemory.details).toContain(
      "When available, it is limited to newly accepted user messages.",
    );
    expect(viewModel.personalMemory.details.join(" ")).not.toContain(
      "Memory Alpha",
    );
  });

  it("maps disabled personal memory without implying a global memory switch", () => {
    const viewModel = buildSettingsV2MemoryPrivacyProductViewModel({
      locale: "en",
      memoryAlphaStatus: baseMemoryAlphaStatus,
    });

    expect(viewModel.personalMemory.value).toBe("Not currently enabled");
    expect(viewModel.personalMemory.details).toContain(
      "Jarvis is not adding new personal memory through this feature.",
    );
  });

  it("fails closed for missing or degraded personal memory status", () => {
    const missing = buildSettingsV2MemoryPrivacyProductViewModel({
      locale: "en",
      memoryAlphaStatus: null,
    });
    const degraded = buildSettingsV2MemoryPrivacyProductViewModel({
      locale: "en",
      memoryAlphaStatus: {
        ...baseMemoryAlphaStatus,
        state: "degraded",
        enabled: true,
      },
    });

    expect(missing.personalMemory.value).toBe(
      "Personal memory status is unavailable",
    );
    expect(degraded.personalMemory.value).toBe(
      "Personal memory status is unavailable",
    );
  });

  it("keeps saved information and storage copy product-safe", () => {
    const viewModel = buildSettingsV2MemoryPrivacyProductViewModel({
      locale: "en",
      memoryAlphaStatus: baseMemoryAlphaStatus,
    });
    const text = [
      viewModel.safeNotice,
      viewModel.savedInformation.value,
      ...viewModel.savedInformation.details,
      viewModel.storageSync.value,
      ...viewModel.storageSync.details,
    ].join("\n");

    expect(text).toContain("Manage");
    expect(text).toContain("Use Memory Center to view or delete saved information.");
    expect(text).toContain("Saved shortcuts");
    expect(text).toContain("Saved voice corrections");
    expect(text).toContain("Saved response preferences");
    expect(text).toContain("Cloud sync is not currently enabled.");
    expect(text).not.toContain("View and deletion controls stay in Memory Center.");
    expect(text).not.toContain(
      "Shows where saved information is kept without exposing device paths.",
    );
    for (const forbidden of [
      "memory-recall",
      "route alias",
      "voice alias",
      "vector",
      "embedding",
      "provider runtime",
      "SQLite",
      "schema",
      "IPC",
      "fixture",
      "runtime status",
      "trusted runtime",
      "snapshot",
      "projection",
      "source of truth",
      "existing feature binding",
      "C:\\",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });
});
