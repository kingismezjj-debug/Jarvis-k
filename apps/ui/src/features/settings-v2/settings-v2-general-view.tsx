import * as React from "react";
import type {
  DesktopCloseButtonBehavior,
  DesktopLaunchAtLoginStatus,
  DesktopSettings,
} from "@jarvis-k/contracts";

import type { UiLanguage } from "@/app/types";
import {
  Button,
  Dialog,
  InlineNotice,
  SearchField,
} from "@/design-system/foundation-components";
import {
  DangerSection,
  SettingRow,
  SettingSwitchRow,
  SettingValueAction,
  SettingsCategoryNav,
  SettingsCategorySelect,
  SettingsPageHeader,
  SettingsSearchEmpty,
  SettingsSearchResult,
  SettingsSection,
} from "@/design-system/settings-components";

import {
  settingsV2Categories,
  type SettingsV2CategoryId,
  type SettingsV2Definition,
  getSettingsV2SearchableDefinitions,
} from "./settings-v2-registry";
import {
  formatSettingsV2Error,
  tSettingsV2,
  type SettingsV2Locale,
} from "./settings-v2-copy";
import "./settings-v2.css";

export type SettingsV2GeneralViewProps = {
  locale: UiLanguage;
  desktopSettings: DesktopSettings | null;
  desktopLaunchAtLoginStatus: DesktopLaunchAtLoginStatus | null;
  sending: boolean;
  error?: string | null;
  onRefreshDesktopSettings: () => void;
  onSelectLanguage: (language: UiLanguage) => void;
  onSetDesktopCloseButtonBehavior: (
    behavior: DesktopCloseButtonBehavior,
  ) => void;
  onSetDesktopLaunchAtLoginEnabled: (enabled: boolean) => void;
};

const migratedCategoryId: SettingsV2CategoryId = "general";

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function getLanguageLabel(locale: SettingsV2Locale, value: UiLanguage): string {
  return tSettingsV2(
    locale,
    value === "zh"
      ? "settings.general.displayLanguage.chinese"
      : "settings.general.displayLanguage.english",
  );
}

function getCloseBehaviorLabel(
  locale: SettingsV2Locale,
  behavior: DesktopCloseButtonBehavior,
): string {
  return tSettingsV2(
    locale,
    behavior === "quit"
      ? "settings.general.closeBehavior.quit"
      : "settings.general.closeBehavior.minimizeToTray",
  );
}

function getLaunchValueLabel(
  locale: SettingsV2Locale,
  settings: DesktopSettings | null,
  status: DesktopLaunchAtLoginStatus | null,
): string {
  if (settings === null) return tSettingsV2(locale, "settings.status.unknown");
  if (status?.supported === false) {
    return tSettingsV2(locale, "settings.status.notSupported");
  }
  return settings.launchAtLoginEnabled
    ? tSettingsV2(locale, "settings.status.on")
    : tSettingsV2(locale, "settings.status.off");
}

function getDefinitionValue({
  definition,
  desktopSettings,
  desktopLaunchAtLoginStatus,
  locale,
}: {
  definition: SettingsV2Definition;
  desktopSettings: DesktopSettings | null;
  desktopLaunchAtLoginStatus: DesktopLaunchAtLoginStatus | null;
  locale: SettingsV2Locale;
}): string {
  if (definition.settingBindingId === "ui.language") {
    return getLanguageLabel(locale, locale);
  }
  if (definition.settingBindingId === "desktop.close_button_behavior") {
    return getCloseBehaviorLabel(
      locale,
      desktopSettings?.closeButtonBehavior ?? "minimize_to_tray",
    );
  }
  if (definition.settingBindingId === "desktop.launch_at_login") {
    return getLaunchValueLabel(locale, desktopSettings, desktopLaunchAtLoginStatus);
  }
  return tSettingsV2(locale, "settings.general.reset.unsupported");
}

function getSearchResults({
  query,
  locale,
  desktopSettings,
  desktopLaunchAtLoginStatus,
}: {
  query: string;
  locale: SettingsV2Locale;
  desktopSettings: DesktopSettings | null;
  desktopLaunchAtLoginStatus: DesktopLaunchAtLoginStatus | null;
}) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length === 0) return [];
  return getSettingsV2SearchableDefinitions()
    .map((definition) => {
      const searchableText = [
        tSettingsV2(locale, definition.labelKey),
        tSettingsV2(locale, definition.descriptionKey),
        ...definition.searchKeywordKeys.map((key) => tSettingsV2(locale, key)),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return { definition, searchableText };
    })
    .filter(({ searchableText }) => searchableText.includes(normalizedQuery))
    .map(({ definition }) => ({
      definition,
      value: getDefinitionValue({
        definition,
        desktopSettings,
        desktopLaunchAtLoginStatus,
        locale,
      }),
    }));
}

export function SettingsV2GeneralView({
  locale,
  desktopSettings,
  desktopLaunchAtLoginStatus,
  sending,
  error,
  onRefreshDesktopSettings,
  onSelectLanguage,
  onSetDesktopCloseButtonBehavior,
  onSetDesktopLaunchAtLoginEnabled,
}: SettingsV2GeneralViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState<SettingsV2CategoryId>(migratedCategoryId);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [languageDialogOpen, setLanguageDialogOpen] = React.useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const categories = React.useMemo(
    () =>
      settingsV2Categories.map((category) => ({
        id: category.id,
        label: tSettingsV2(locale, category.labelKey),
      })),
    [locale],
  );

  const searchResults = React.useMemo(
    () =>
      getSearchResults({
        query: searchQuery,
        locale,
        desktopSettings,
        desktopLaunchAtLoginStatus,
      }),
    [desktopLaunchAtLoginStatus, desktopSettings, locale, searchQuery],
  );

  const closeBehavior =
    desktopSettings?.closeButtonBehavior ?? "minimize_to_tray";
  const launchSupported = desktopLaunchAtLoginStatus?.supported === true;
  const launchCanModify =
    launchSupported && desktopLaunchAtLoginStatus?.canModify !== false;

  return (
    <div
      className="jk-theme settings-v2-shell"
      data-testid="settings-v2-view"
    >
      <SettingsPageHeader
        action={
          <span className="settings-v2-chip">
            {tSettingsV2(locale, "settings.shell.migratedOnly")}
          </span>
        }
        description={tSettingsV2(locale, "settings.shell.description")}
        title={tSettingsV2(locale, "settings.shell.title")}
      />

      <div className="settings-v2-search-row">
        <SearchField
          data-testid="settings-v2-search"
          label={tSettingsV2(locale, "settings.shell.search")}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          value={searchQuery}
        />
        <div className="settings-v2-narrow-category">
          <SettingsCategorySelect
            categories={categories}
            label={tSettingsV2(locale, "settings.shell.category")}
            onSelect={(categoryId) =>
              setSelectedCategoryId(categoryId as SettingsV2CategoryId)
            }
            selectedId={selectedCategoryId}
          />
        </div>
      </div>

      <div className="settings-v2-layout">
        <div
          className="settings-v2-wide-category"
          data-testid="settings-v2-category-nav"
        >
          <SettingsCategoryNav
            categories={categories}
            onSelect={(categoryId) =>
              setSelectedCategoryId(categoryId as SettingsV2CategoryId)
            }
            selectedId={selectedCategoryId}
          />
        </div>

        <main className="settings-v2-content">
          {searchQuery.trim().length > 0 ? (
            <section data-testid="settings-v2-search-results">
              <h2 className="settings-v2-search-title">
                {searchResults.length}{" "}
                {tSettingsV2(locale, "settings.search.results")}
              </h2>
              <div className="settings-v2-search-list">
                {searchResults.length > 0 ? (
                  searchResults.map(({ definition, value }) => (
                    <SettingsSearchResult
                      breadcrumb={`${tSettingsV2(locale, "settings.categories.general")} / ${tSettingsV2(locale, definition.sectionId === "interface" ? "settings.general.section.interface" : definition.sectionId === "desktop" ? "settings.general.section.desktop" : "settings.general.section.reset")}`}
                      description={tSettingsV2(locale, definition.descriptionKey)}
                      key={definition.settingId}
                      title={tSettingsV2(locale, definition.labelKey)}
                      value={`${tSettingsV2(locale, "settings.common.currentValue")}: ${value}`}
                    />
                  ))
                ) : (
                  <div data-testid="settings-v2-search-empty">
                    <SettingsSearchEmpty
                      description={tSettingsV2(
                        locale,
                        "settings.search.noResultsDescription",
                      )}
                      title={tSettingsV2(locale, "settings.search.noResultsTitle")}
                    />
                  </div>
                )}
              </div>
            </section>
          ) : selectedCategoryId === migratedCategoryId ? (
            <section data-testid="settings-v2-general">
              <SettingsPageHeader
                description={tSettingsV2(locale, "settings.general.description")}
                title={tSettingsV2(locale, "settings.general.title")}
              />
              {error ? (
                <InlineNotice title={formatSettingsV2Error(locale, "save_failed")} tone="warning">
                  {formatSettingsV2Error(locale, "unavailable")}
                </InlineNotice>
              ) : null}

              <SettingsSection
                title={tSettingsV2(locale, "settings.general.section.interface")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.general.displayLanguage.description",
                  )}
                  title={tSettingsV2(
                    locale,
                    "settings.general.displayLanguage.label",
                  )}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(
                      locale,
                      "settings.general.displayLanguage.action",
                    )}
                    onAction={() => setLanguageDialogOpen(true)}
                    value={getLanguageLabel(locale, locale)}
                  />
                </SettingRow>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.general.section.desktop")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.general.closeBehavior.description",
                  )}
                  title={tSettingsV2(
                    locale,
                    "settings.general.closeBehavior.label",
                  )}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(
                      locale,
                      "settings.general.closeBehavior.action",
                    )}
                    onAction={() => setCloseDialogOpen(true)}
                    value={getCloseBehaviorLabel(locale, closeBehavior)}
                  />
                </SettingRow>
                <SettingSwitchRow
                  checked={desktopSettings?.launchAtLoginEnabled ?? false}
                  description={
                    launchSupported
                      ? tSettingsV2(
                          locale,
                          "settings.general.launchAtLogin.description",
                        )
                      : tSettingsV2(
                          locale,
                          "settings.general.launchAtLogin.unavailable",
                        )
                  }
                  disabled={!launchCanModify || sending}
                  onCheckedChange={onSetDesktopLaunchAtLoginEnabled}
                  title={tSettingsV2(
                    locale,
                    "settings.general.launchAtLogin.label",
                  )}
                />
                <div
                  className="settings-v2-status-row"
                  data-testid="settings-v2-launch-at-login"
                >
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {getLaunchValueLabel(
                      locale,
                      desktopSettings,
                      desktopLaunchAtLoginStatus,
                    )}
                  </span>
                  {!launchSupported || desktopLaunchAtLoginStatus?.mismatch ? (
                    <Button
                      disabled={sending}
                      onClick={onRefreshDesktopSettings}
                      variant="ghost"
                    >
                      {tSettingsV2(locale, "settings.general.launchAtLogin.retry")}
                    </Button>
                  ) : null}
                </div>
              </SettingsSection>

              <DangerSection
                actionDisabled
                actionLabel={tSettingsV2(locale, "settings.general.reset.action")}
                description={tSettingsV2(locale, "settings.general.reset.description")}
                impact={tSettingsV2(locale, "settings.general.reset.impact")}
                title={tSettingsV2(locale, "settings.general.section.reset")}
              />
              <div className="settings-v2-reset-details">
                <span>{tSettingsV2(locale, "settings.general.reset.unsupported")}</span>
                <Button
                  data-testid="settings-v2-reset-action"
                  onClick={() => setResetDialogOpen(true)}
                  variant="secondary"
                >
                  {tSettingsV2(locale, "settings.general.reset.details")}
                </Button>
              </div>
            </section>
          ) : (
            <section
              className="settings-v2-placeholder"
              data-testid="settings-v2-placeholder"
            >
              <SettingsSearchEmpty
                description={tSettingsV2(
                  locale,
                  "settings.shell.notMigratedDescription",
                )}
                title={tSettingsV2(locale, "settings.shell.notMigratedTitle")}
              />
            </section>
          )}
        </main>
      </div>

      <Dialog
        description={tSettingsV2(
          locale,
          "settings.general.displayLanguage.dialogDescription",
        )}
        onClose={() => setLanguageDialogOpen(false)}
        open={languageDialogOpen}
        title={tSettingsV2(locale, "settings.general.displayLanguage.dialogTitle")}
      >
        <div className="settings-v2-dialog-actions" data-testid="settings-v2-language-dialog">
          <Button
            onClick={() => {
              onSelectLanguage("en");
              setLanguageDialogOpen(false);
            }}
            variant={locale === "en" ? "primary" : "secondary"}
          >
            {tSettingsV2(locale, "settings.general.displayLanguage.english")}
          </Button>
          <Button
            onClick={() => {
              onSelectLanguage("zh");
              setLanguageDialogOpen(false);
            }}
            variant={locale === "zh" ? "primary" : "secondary"}
          >
            {tSettingsV2(locale, "settings.general.displayLanguage.chinese")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        description={tSettingsV2(
          locale,
          "settings.general.closeBehavior.dialogDescription",
        )}
        onClose={() => setCloseDialogOpen(false)}
        open={closeDialogOpen}
        title={tSettingsV2(locale, "settings.general.closeBehavior.dialogTitle")}
      >
        <div className="settings-v2-dialog-actions" data-testid="settings-v2-close-dialog">
          <Button
            onClick={() => {
              onSetDesktopCloseButtonBehavior("minimize_to_tray");
              setCloseDialogOpen(false);
            }}
            variant={closeBehavior === "minimize_to_tray" ? "primary" : "secondary"}
          >
            {tSettingsV2(locale, "settings.general.closeBehavior.minimizeToTray")}
          </Button>
          <Button
            onClick={() => {
              onSetDesktopCloseButtonBehavior("quit");
              setCloseDialogOpen(false);
            }}
            variant={closeBehavior === "quit" ? "primary" : "secondary"}
          >
            {tSettingsV2(locale, "settings.general.closeBehavior.quit")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        description={tSettingsV2(locale, "settings.confirmation.resetDescription")}
        onClose={() => setResetDialogOpen(false)}
        open={resetDialogOpen}
        title={tSettingsV2(locale, "settings.confirmation.resetTitle")}
      >
        <div className="settings-v2-dialog-actions" data-testid="settings-v2-reset-dialog">
          <InlineNotice title={tSettingsV2(locale, "settings.general.reset.unsupported")} tone="warning">
            {tSettingsV2(locale, "settings.general.reset.impact")}
          </InlineNotice>
          <Button onClick={() => setResetDialogOpen(false)} variant="secondary">
            {tSettingsV2(locale, "settings.common.close")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
