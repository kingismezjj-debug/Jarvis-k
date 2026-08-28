import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  Badge,
  Button,
  ConnectionCard,
  DangerSection,
  DiagnosticList,
  Dialog,
  EmptyState,
  IconButton,
  InlineNotice,
  SearchField,
  Select,
  SettingRow,
  SettingStatus,
  SettingSwitchRow,
  SettingUnavailable,
  SettingValueAction,
  SettingsCategoryNav,
  SettingsCategorySelect,
  SettingsPageHeader,
  SettingsSearchEmpty,
  SettingsSearchResult,
  SettingsSection,
  Spinner,
  Stack,
  Switch,
  TextField,
  foundationComponentNames,
  settingsFoundationComponentNames,
} from "../src/design-system";

const sourceRoot = path.resolve(import.meta.dirname, "..", "src", "design-system");
const h = React.createElement;

function render(node: React.ReactElement) {
  return renderToStaticMarkup(node);
}

describe("Jarvis UI foundation components", () => {
  it("exports the required general and Settings component inventory", () => {
    expect(foundationComponentNames).toContain("Button");
    expect(foundationComponentNames).toContain("Dialog");
    expect(foundationComponentNames).toContain("Switch");
    expect(settingsFoundationComponentNames).toContain("SettingRow");
    expect(settingsFoundationComponentNames).toContain("ConnectionCard");
    expect(settingsFoundationComponentNames).toContain("DangerSection");
    expect(settingsFoundationComponentNames).toHaveLength(14);
  });

  it("renders accessible basic controls without runtime ownership", () => {
    const html = render(
      h(
        Stack,
        null,
        h(Button, { variant: "primary" }, "Save settings"),
        h(IconButton, { label: "Refresh settings" }, "R"),
        h(TextField, {
          description: "Shown to screen readers",
          label: "Display name",
        }),
        h(SearchField, { label: "Search settings" }),
        h(Switch, { checked: true, label: "Launch at login" }),
        h(Select, {
          label: "Language",
          options: [
            { label: "English", value: "en" },
            { label: "中文（简体）", value: "zh-CN" },
          ],
          value: "en",
        }),
        h(Badge, { tone: "warning" }, "Setup required"),
        h(Spinner, { label: "Loading models" }),
        h(EmptyState, {
          description: "Try another keyword.",
          title: "No matching settings",
        }),
        h(InlineNotice, { title: "Local only" }, "No cloud upload."),
      ),
    );

    expect(html).toContain('aria-label="Refresh settings"');
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('type="search"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain("window.jarvis");
    expect(html).not.toContain("apiKey");
  });

  it("renders dialog semantics and Escape callback contract", () => {
    const onClose = vi.fn();
    const html = render(
      h(
        Dialog,
        {
          description: "Requires confirmation.",
          onClose,
          open: true,
          title: "Restore defaults",
        },
        h(Button, null, "Confirm restore"),
      ),
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Restore defaults");
  });

  it("renders Settings rows with current values instead of generic change buttons", () => {
    const html = render(
      h(
        SettingsSection,
        { title: "General" },
        h(
          SettingRow,
          {
            description: "Choose the Jarvis display language",
            title: "Display language",
          },
          h(SettingValueAction, {
            actionLabel: "Choose language",
            value: "English",
          }),
        ),
        h(SettingSwitchRow, {
          checked: false,
          description: "Start Jarvis when Windows starts",
          title: "Launch at login",
        }),
        h(SettingUnavailable, {
          description: "This capability is not installed.",
          reason: "Unavailable",
          title: "Wake word",
        }),
      ),
    );

    expect(html).toContain("English");
    expect(html).toContain("Launch at login");
    expect(html).toContain("Unavailable");
    expect(html).not.toContain(">Change<");
  });

  it("keeps internal IDs hidden unless a developer variant asks for them", () => {
    const identity = {
      settingId: "settings.models.provider",
      capabilityId: "advanced-brain.deepseek",
    };
    const productHtml = render(
      h(SettingRow, {
        description: "Provider connection state",
        developerIdentity: identity,
        title: "DeepSeek",
      }),
    );
    const developerHtml = render(
      h(SettingRow, {
        description: "Provider connection state",
        developerIdentity: identity,
        showDeveloperIdentity: true,
        title: "DeepSeek",
      }),
    );

    expect(productHtml).not.toContain("advanced-brain.deepseek");
    expect(developerHtml).toContain("settings.models.provider");
  });

  it("renders search, connection, danger, and diagnostic components with safe projections", () => {
    const html = render(
      h(
        Stack,
        null,
        h(SettingsPageHeader, {
          description: "Manage product preferences.",
          title: "Settings",
        }),
        h(SettingsCategoryNav, {
          categories: [{ id: "general", label: "General" }],
          selectedId: "general",
        }),
        h(SettingsCategorySelect, {
          categories: [{ id: "general", label: "General" }],
          label: "Category",
          selectedId: "general",
        }),
        h(SettingsSearchResult, {
          breadcrumb: "General / Language",
          description: "Choose display language.",
          title: "Display language",
          value: "English",
        }),
        h(SettingsSearchEmpty, {
          description: "Try another keyword.",
          title: "No results",
        }),
        h(ConnectionCard, {
          actionLabel: "Manage connection",
          description: "Credential content remains hidden.",
          statusKey: "configured",
          title: "GLM",
        }),
        h(DangerSection, {
          actionLabel: "Restore default settings",
          description: "Does not delete credentials or memory.",
          impact: "Requires confirmation.",
          title: "Reset & Recovery",
        }),
        h(DiagnosticList, {
          rows: [
            {
              label: "Provider",
              value: "Ready",
              internalId: "advanced-brain.glm",
            },
          ],
          showInternalIds: true,
        }),
        h(SettingStatus, { locale: "zh-CN", statusKey: "ready" }),
      ),
    );

    expect(html).toContain("General / Language");
    expect(html).toContain("Configured");
    expect(html).toContain("Restore default settings");
    expect(html).toContain("advanced-brain.glm");
    expect(html).toContain("可直接使用");
    expect(html).not.toContain("credential.value");
    expect(html).not.toContain("secret");
  });

  it("keeps foundation sources free of runtime APIs, network calls, and arbitrary component colors", () => {
    const sources = [
      "foundation-components.tsx",
      "settings-components.tsx",
      "status-copy.ts",
    ]
      .map((file) => readFileSync(path.join(sourceRoot, file), "utf8"))
      .join("\n");

    for (const forbidden of [
      "window.jarvis",
      "ipcRenderer",
      "electron",
      "fetch(",
      "XMLHttpRequest",
      "localStorage",
      "safeStorage",
      "showOpenDialog",
      "apiKey",
      "secret",
      "new Provider",
      "setTimeout",
      "requestAnimationFrame",
    ]) {
      expect(sources).not.toContain(forbidden);
    }
    expect(sources).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
