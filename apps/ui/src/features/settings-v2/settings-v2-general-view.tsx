import * as React from "react";
import type {
  DesktopCloseButtonBehavior,
  DesktopLaunchAtLoginStatus,
  DesktopPetReducedMotion,
  DesktopSettings,
  PetSkinRegistryProjection,
} from "@jarvis-k/contracts";

import { builtInSkinThemes } from "@/app/skin-themes";
import type { SkinThemeId, UiLanguage } from "@/app/types";
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
  type SettingsV2CopyKey,
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
  activeThemeId: SkinThemeId;
  petSkinRegistry: PetSkinRegistryProjection | null;
  onSelectTheme: (themeId: SkinThemeId) => void;
  onSetDesktopPetEnabled: (enabled: boolean) => void;
  onSetDesktopPetAlwaysOnTop: (enabled: boolean) => void;
  onSetDesktopPetReducedMotion: (mode: DesktopPetReducedMotion) => void;
  onResetDesktopPetPosition: () => void;
  onOpenExistingSkinManagement?: () => void;
  initialCategoryId?: SettingsV2CategoryId;
};

const defaultCategoryId: SettingsV2CategoryId = "general";
const desktopPetReducedMotionModes: DesktopPetReducedMotion[] = [
  "system",
  "on",
  "off",
];

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

function getThemeLabel(locale: SettingsV2Locale, themeId: SkinThemeId): string {
  return tSettingsV2(locale, getThemeCopyKey(themeId, "label"));
}

function getThemeDescription(
  locale: SettingsV2Locale,
  themeId: SkinThemeId,
): string {
  return tSettingsV2(locale, getThemeCopyKey(themeId, "description"));
}

function getThemeCopyKey(
  themeId: SkinThemeId,
  kind: "label" | "description",
): SettingsV2CopyKey {
  if (themeId === "harbor") {
    return kind === "label"
      ? "settings.theme.harbor.label"
      : "settings.theme.harbor.description";
  }
  if (themeId === "ember") {
    return kind === "label"
      ? "settings.theme.ember.label"
      : "settings.theme.ember.description";
  }
  return kind === "label"
    ? "settings.theme.signal.label"
    : "settings.theme.signal.description";
}

function getPetVisibilityLabel(
  locale: SettingsV2Locale,
  settings: DesktopSettings | null,
): string {
  if (settings === null) return tSettingsV2(locale, "settings.status.unknown");
  return settings.desktopPetEnabled
    ? tSettingsV2(locale, "settings.pet.status.enabled")
    : tSettingsV2(locale, "settings.pet.status.disabled");
}

function getReducedMotionLabel(
  locale: SettingsV2Locale,
  mode: DesktopPetReducedMotion,
): string {
  return tSettingsV2(
    locale,
    mode === "on"
      ? "settings.pet.status.motionReduced"
      : mode === "off"
        ? "settings.pet.status.motionFull"
        : "settings.pet.status.motionSystem",
  );
}

function getCategoryLabel(
  locale: SettingsV2Locale,
  categoryId: SettingsV2CategoryId,
): string {
  const category = settingsV2Categories.find((item) => item.id === categoryId);
  return category ? tSettingsV2(locale, category.labelKey) : "";
}

function getSectionLabel(
  locale: SettingsV2Locale,
  sectionId: SettingsV2Definition["sectionId"],
): string {
  const sectionKeys: Record<SettingsV2Definition["sectionId"], SettingsV2CopyKey> = {
    interface: "settings.general.section.interface",
    desktop: "settings.general.section.desktop",
    reset: "settings.general.section.reset",
    appearance: "settings.appearance.section.theme",
    desktop_pet: "settings.appearance.section.pet",
    pet_skin: "settings.appearance.section.skin",
  };
  return tSettingsV2(locale, sectionKeys[sectionId]);
}

function getDefinitionValue({
  definition,
  desktopSettings,
  desktopLaunchAtLoginStatus,
  locale,
  activeThemeId,
  petSkinRegistry,
}: {
  definition: SettingsV2Definition;
  desktopSettings: DesktopSettings | null;
  desktopLaunchAtLoginStatus: DesktopLaunchAtLoginStatus | null;
  locale: SettingsV2Locale;
  activeThemeId: SkinThemeId;
  petSkinRegistry: PetSkinRegistryProjection | null;
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
  if (definition.settingBindingId === "ui.theme") {
    return getThemeLabel(locale, activeThemeId);
  }
  if (definition.settingBindingId === "desktop.pet_enabled") {
    return getPetVisibilityLabel(locale, desktopSettings);
  }
  if (definition.settingBindingId === "desktop.pet_always_on_top") {
    if (desktopSettings === null) return tSettingsV2(locale, "settings.status.unknown");
    return desktopSettings.desktopPetAlwaysOnTop
      ? tSettingsV2(locale, "settings.status.on")
      : tSettingsV2(locale, "settings.status.off");
  }
  if (definition.settingBindingId === "desktop.pet_reduced_motion") {
    return getReducedMotionLabel(
      locale,
      desktopSettings?.desktopPetReducedMotion ?? "system",
    );
  }
  if (definition.settingBindingId === "desktop.pet_position_reset") {
    return tSettingsV2(locale, "settings.pet.resetPosition.action");
  }
  if (definition.settingBindingId === "desktop.pet_skin_summary") {
    if (petSkinRegistry?.activeSkin) return petSkinRegistry.activeSkin.displayName;
    return tSettingsV2(locale, "settings.skin.status.builtIn");
  }
  return tSettingsV2(locale, "settings.general.reset.unsupported");
}

function getSearchResults({
  query,
  locale,
  desktopSettings,
  desktopLaunchAtLoginStatus,
  activeThemeId,
  petSkinRegistry,
}: {
  query: string;
  locale: SettingsV2Locale;
  desktopSettings: DesktopSettings | null;
  desktopLaunchAtLoginStatus: DesktopLaunchAtLoginStatus | null;
  activeThemeId: SkinThemeId;
  petSkinRegistry: PetSkinRegistryProjection | null;
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
        activeThemeId,
        petSkinRegistry,
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
  activeThemeId,
  petSkinRegistry,
  onSelectTheme,
  onSetDesktopPetEnabled,
  onSetDesktopPetAlwaysOnTop,
  onSetDesktopPetReducedMotion,
  onResetDesktopPetPosition,
  onOpenExistingSkinManagement,
  initialCategoryId,
}: SettingsV2GeneralViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState<SettingsV2CategoryId>(initialCategoryId ?? defaultCategoryId);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [languageDialogOpen, setLanguageDialogOpen] = React.useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = React.useState(false);
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
        activeThemeId,
        petSkinRegistry,
      }),
    [
      activeThemeId,
      desktopLaunchAtLoginStatus,
      desktopSettings,
      locale,
      petSkinRegistry,
      searchQuery,
    ],
  );

  const closeBehavior =
    desktopSettings?.closeButtonBehavior ?? "minimize_to_tray";
  const launchSupported = desktopLaunchAtLoginStatus?.supported === true;
  const launchCanModify =
    launchSupported && desktopLaunchAtLoginStatus?.canModify !== false;
  const reducedMotion =
    desktopSettings?.desktopPetReducedMotion ?? "system";
  const activeSkinDisplayName =
    petSkinRegistry?.activeSkin?.displayName ??
    tSettingsV2(locale, "settings.skin.status.builtIn");
  const activeSkinSource = petSkinRegistry?.activeSkin
    ? tSettingsV2(locale, "settings.skin.status.local")
    : tSettingsV2(locale, "settings.skin.status.builtIn");
  const skinHealth =
    petSkinRegistry === null
      ? tSettingsV2(locale, "settings.skin.status.notLoaded")
      : petSkinRegistry.registryHealthy
        ? tSettingsV2(locale, "settings.skin.status.healthy")
        : tSettingsV2(locale, "settings.skin.status.recovered");

  return (
    <div
      className="jk-theme settings-v2-shell"
      data-jarvis-theme={activeThemeId}
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
                      breadcrumb={`${getCategoryLabel(locale, definition.categoryId)} / ${getSectionLabel(locale, definition.sectionId)}`}
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
          ) : selectedCategoryId === "general" ? (
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
          ) : selectedCategoryId === "appearance_pet" ? (
            <section data-testid="settings-v2-appearance-pet">
              <SettingsPageHeader
                description={tSettingsV2(locale, "settings.appearance.description")}
                title={tSettingsV2(locale, "settings.appearance.title")}
              />
              {error ? (
                <InlineNotice title={formatSettingsV2Error(locale, "save_failed")} tone="warning">
                  {formatSettingsV2Error(locale, "unavailable")}
                </InlineNotice>
              ) : null}

              <SettingsSection
                description={tSettingsV2(
                  locale,
                  "settings.appearance.theme.previewDescription",
                )}
                title={tSettingsV2(locale, "settings.appearance.section.theme")}
              >
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.appearance.theme.description",
                  )}
                  title={tSettingsV2(locale, "settings.appearance.theme.label")}
                >
                  <SettingValueAction
                    actionLabel={tSettingsV2(
                      locale,
                      "settings.appearance.theme.action",
                    )}
                    onAction={() => setThemeDialogOpen(true)}
                    value={getThemeLabel(locale, activeThemeId)}
                  />
                </SettingRow>
                <ThemeChoiceGrid
                  activeThemeId={activeThemeId}
                  locale={locale}
                  onSelectTheme={onSelectTheme}
                  sending={sending}
                />
                <ThemePreview activeThemeId={activeThemeId} locale={locale} />
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.appearance.section.pet")}
              >
                <SettingSwitchRow
                  checked={desktopSettings?.desktopPetEnabled ?? false}
                  description={tSettingsV2(locale, "settings.pet.show.description")}
                  disabled={desktopSettings === null || sending}
                  onCheckedChange={onSetDesktopPetEnabled}
                  title={tSettingsV2(locale, "settings.pet.show.label")}
                />
                <SettingSwitchRow
                  checked={desktopSettings?.desktopPetAlwaysOnTop ?? true}
                  description={tSettingsV2(
                    locale,
                    "settings.pet.keepOnTop.description",
                  )}
                  disabled={desktopSettings === null || sending}
                  onCheckedChange={onSetDesktopPetAlwaysOnTop}
                  title={tSettingsV2(locale, "settings.pet.keepOnTop.label")}
                />
                <SettingRow
                  description={tSettingsV2(
                    locale,
                    "settings.pet.reducedMotion.description",
                  )}
                  title={tSettingsV2(locale, "settings.pet.reducedMotion.label")}
                >
                  <div
                    className="settings-v2-segmented"
                    data-testid="settings-v2-pet-reduced-motion"
                  >
                    {desktopPetReducedMotionModes.map(
                      (mode) => (
                        <Button
                          aria-pressed={reducedMotion === mode}
                          className="settings-v2-segment"
                          disabled={desktopSettings === null || sending}
                          key={mode}
                          onClick={() => onSetDesktopPetReducedMotion(mode)}
                          variant={reducedMotion === mode ? "primary" : "ghost"}
                        >
                          {tSettingsV2(
                            locale,
                            mode === "system"
                              ? "settings.pet.reducedMotion.system"
                              : mode === "on"
                                ? "settings.pet.reducedMotion.on"
                                : "settings.pet.reducedMotion.off",
                          )}
                        </Button>
                      ),
                    )}
                  </div>
                </SettingRow>
                <div className="settings-v2-status-row" data-testid="settings-v2-pet-status">
                  <span>
                    {tSettingsV2(locale, "settings.common.currentValue")}:{" "}
                    {getPetVisibilityLabel(locale, desktopSettings)} /{" "}
                    {getReducedMotionLabel(locale, reducedMotion)}
                  </span>
                  <Button
                    disabled={desktopSettings === null || sending}
                    onClick={onResetDesktopPetPosition}
                    variant="secondary"
                  >
                    {tSettingsV2(locale, "settings.pet.resetPosition.action")}
                  </Button>
                </div>
              </SettingsSection>

              <SettingsSection
                title={tSettingsV2(locale, "settings.appearance.section.skin")}
              >
                <SkinSummaryCard
                  activeSkinDisplayName={activeSkinDisplayName}
                  activeSkinSource={activeSkinSource}
                  installedCount={petSkinRegistry?.installedSkins.length ?? 0}
                  locale={locale}
                  registryHealth={skinHealth}
                />
                <div className="settings-v2-status-row" data-testid="settings-v2-skin-management">
                  <span>{tSettingsV2(locale, "settings.skin.manage.description")}</span>
                  <Button
                    disabled={!onOpenExistingSkinManagement}
                    onClick={onOpenExistingSkinManagement}
                    variant="secondary"
                  >
                    {tSettingsV2(locale, "settings.skin.manage.action")}
                  </Button>
                </div>
              </SettingsSection>
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
        description={tSettingsV2(
          locale,
          "settings.appearance.theme.dialogDescription",
        )}
        onClose={() => setThemeDialogOpen(false)}
        open={themeDialogOpen}
        title={tSettingsV2(locale, "settings.appearance.theme.dialogTitle")}
      >
        <div className="settings-v2-dialog-actions" data-testid="settings-v2-theme-dialog">
          {builtInSkinThemes.map((theme) => (
            <Button
              key={theme.id}
              onClick={() => {
                onSelectTheme(theme.id);
                setThemeDialogOpen(false);
              }}
              variant={activeThemeId === theme.id ? "primary" : "secondary"}
            >
              {getThemeLabel(locale, theme.id)}
            </Button>
          ))}
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

function ThemeChoiceGrid({
  activeThemeId,
  locale,
  onSelectTheme,
  sending,
}: {
  activeThemeId: SkinThemeId;
  locale: SettingsV2Locale;
  onSelectTheme: (themeId: SkinThemeId) => void;
  sending: boolean;
}) {
  return (
    <div className="settings-v2-theme-grid" data-testid="settings-v2-theme-choices">
      {builtInSkinThemes.map((theme) => (
        <button
          aria-pressed={activeThemeId === theme.id}
          className="settings-v2-theme-choice"
          data-selected={activeThemeId === theme.id}
          data-testid={`settings-v2-theme-${theme.id}`}
          disabled={sending}
          key={theme.id}
          onClick={() => onSelectTheme(theme.id)}
          type="button"
        >
          <span className="settings-v2-theme-swatches" aria-hidden="true">
            {theme.swatches.map((color) => (
              <span
                className="settings-v2-theme-swatch"
                key={color}
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          <strong>{getThemeLabel(locale, theme.id)}</strong>
          <span>
            {getThemeDescription(locale, theme.id)}
          </span>
        </button>
      ))}
    </div>
  );
}

function ThemePreview({
  activeThemeId,
  locale,
}: {
  activeThemeId: SkinThemeId;
  locale: SettingsV2Locale;
}) {
  const activeTheme =
    builtInSkinThemes.find((theme) => theme.id === activeThemeId) ??
    builtInSkinThemes[0];
  return (
    <article className="settings-v2-theme-preview" data-testid="settings-v2-theme-preview">
      <div className="settings-v2-theme-preview-frame">
        <span className="settings-v2-theme-preview-dot" />
        <div className="settings-v2-theme-preview-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="settings-v2-theme-preview-accent" />
      </div>
      <div className="jk-stack">
        <strong>{tSettingsV2(locale, "settings.appearance.theme.previewTitle")}</strong>
        <span className="jk-muted">
          {getThemeLabel(locale, activeTheme.id)}
        </span>
      </div>
    </article>
  );
}

function SkinSummaryCard({
  activeSkinDisplayName,
  activeSkinSource,
  installedCount,
  locale,
  registryHealth,
}: {
  activeSkinDisplayName: string;
  activeSkinSource: string;
  installedCount: number;
  locale: SettingsV2Locale;
  registryHealth: string;
}) {
  return (
    <article className="settings-v2-skin-summary" data-testid="settings-v2-skin-summary">
      <div className="jk-stack">
        <strong>{activeSkinDisplayName}</strong>
        <span className="jk-muted">{activeSkinSource}</span>
      </div>
      <dl>
        <div>
          <dt>{tSettingsV2(locale, "settings.common.currentValue")}</dt>
          <dd>{registryHealth}</dd>
        </div>
        <div>
          <dt>{tSettingsV2(locale, "settings.appearance.section.skin")}</dt>
          <dd>
            {installedCount > 0
              ? `${installedCount}`
              : tSettingsV2(locale, "settings.skin.empty.title")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
