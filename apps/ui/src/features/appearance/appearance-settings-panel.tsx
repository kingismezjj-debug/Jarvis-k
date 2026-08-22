import { Palette } from "lucide-react";
import type {
  PetSkinFormalState,
  PetSkinIdentity,
  PetSkinPreviewSelectResult,
  PetSkinRegistryProjection,
} from "@jarvis-k/contracts";

import type { uiCopy } from "@/app/copy";
import type { SkinThemeId } from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];

export type AppearanceThemeOption = {
  id: SkinThemeId;
  label: string;
  description: string;
  swatches: [string, string, string];
};

export function AppearanceSettingsPanel({
  activeTheme,
  copy,
  currentThemeId,
  petSkinPreviewLoading,
  petSkinPreviewResult,
  petSkinRegistry,
  onActivatePetSkin,
  onCancelPetSkinPreview,
  onInstallPetSkinPreview,
  onRefreshPetSkinRegistry,
  onRemovePetSkin,
  onReturnPetSkinToBuiltIn,
  onSelectTheme,
  onSelectPetSkinPreview,
  showPetSkinPreview,
  storageKey,
  themes,
}: {
  activeTheme: AppearanceThemeOption;
  copy: Copy;
  currentThemeId: SkinThemeId;
  petSkinPreviewLoading: boolean;
  petSkinPreviewResult: PetSkinPreviewSelectResult | null;
  petSkinRegistry: PetSkinRegistryProjection | null;
  onActivatePetSkin: (identity: PetSkinIdentity) => void;
  onCancelPetSkinPreview: () => void;
  onInstallPetSkinPreview: () => void;
  onRefreshPetSkinRegistry: () => void;
  onRemovePetSkin: (identity: PetSkinIdentity) => void;
  onReturnPetSkinToBuiltIn: () => void;
  onSelectTheme: (themeId: SkinThemeId) => void;
  onSelectPetSkinPreview: () => void;
  showPetSkinPreview: boolean;
  storageKey: string;
  themes: AppearanceThemeOption[];
}) {
  const preview = petSkinPreviewResult?.ok ? petSkinPreviewResult.preview : null;
  const previewError =
    petSkinPreviewResult && !petSkinPreviewResult.ok ? petSkinPreviewResult : null;
  return (
    <section
      className="min-w-0 lg:col-span-2"
      data-testid="skin-theme-settings"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="size-4 text-primary" />
          {copy.settings.theme}
        </h3>
        <Badge
          className="rounded-md text-[10px]"
          data-testid="skin-theme-current"
          variant="outline"
        >
          {copy.settings.themeCurrent}: {activeTheme.label}
        </Badge>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {themes.map((theme) => (
          <Button
            aria-pressed={currentThemeId === theme.id}
            className={cn(
              "h-auto min-h-[76px] justify-start rounded-md px-3 py-2 text-left",
              currentThemeId === theme.id && "border-primary text-primary",
            )}
            data-testid={`skin-theme-${theme.id}`}
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            type="button"
            variant={currentThemeId === theme.id ? "secondary" : "ghost"}
          >
            <span className="flex min-w-0 flex-col gap-2">
              <span className="flex items-center gap-1.5">
                {theme.swatches.map((color) => (
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-sm border border-border"
                    key={color}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="text-xs font-semibold">
                {theme.id === "signal"
                  ? copy.settings.signalTheme
                  : theme.id === "harbor"
                    ? copy.settings.harborTheme
                    : copy.settings.emberTheme}
              </span>
              <span className="text-[10px] leading-4 text-muted-foreground">
                {theme.description}
              </span>
            </span>
          </Button>
        ))}
      </div>
      <dl
        className="mt-3 divide-y divide-border border-y text-[11px]"
        data-testid="skin-theme-safety"
      >
        <Metric
          label={copy.settings.themeSchema}
          tone="accent"
          value="builtin_theme_schema_v1"
        />
        <Metric
          label={copy.settings.themeStorage}
          tone="success"
          value={storageKey}
        />
        <Metric
          label={copy.settings.themeRecovery}
          tone="success"
          value="signal"
        />
        <Metric label={copy.settings.themeSafe} tone="success" value="yes" />
      </dl>
      {showPetSkinPreview ? (
        <section
          className="mt-4 border-t pt-3"
          data-testid="pet-skin-preview-panel"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold">Local Pet Skin Preview</h4>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                Validates asset-only .jkskin packages for temporary preview.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                className="h-8 rounded-md px-3 text-xs"
                disabled={petSkinPreviewLoading}
                onClick={onSelectPetSkinPreview}
                type="button"
                variant="secondary"
              >
                {petSkinPreviewLoading ? "Checking" : "Choose .jkskin"}
              </Button>
              <Button
                className="h-8 rounded-md px-3 text-xs"
                disabled={!preview && !previewError}
                onClick={onCancelPetSkinPreview}
                type="button"
                variant="ghost"
              >
                Clear
              </Button>
            </div>
          </div>
          {preview ? (
            <div className="mt-3 space-y-3" data-testid="pet-skin-preview-ok">
              <dl className="divide-y divide-border border-y text-[11px]">
                <Metric label="Name" tone="accent" value={preview.displayName} />
                <Metric label="Author" value={preview.author} />
                <Metric label="License" value={preview.license} />
                <Metric label="Version" value={preview.skinVersion} />
                <Metric
                  label="Trust"
                  tone="success"
                  value={preview.trustState}
                />
              </dl>
              <PreviewGrid
                states={preview.states}
                resources={preview.resources}
                title="Animated states"
              />
              <PreviewGrid
                states={preview.reducedMotionStates}
                resources={preview.resources}
                title="Reduced motion states"
              />
              <Button
                className="h-8 rounded-md px-3 text-xs"
                onClick={onInstallPetSkinPreview}
                type="button"
                variant="secondary"
              >
                Install
              </Button>
            </div>
          ) : null}
          {previewError ? (
            <div
              className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[11px]"
              data-testid="pet-skin-preview-error"
            >
              <span className="font-semibold">{previewError.reasonCode}</span>
              <span className="ml-2 text-muted-foreground">
                {previewError.safeMessage}
              </span>
            </div>
          ) : null}
          <section
            className="mt-4 border-t pt-3"
            data-testid="pet-skin-installed-panel"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-xs font-semibold">Installed Pet Skins</h4>
              <div className="flex gap-2">
                <Button
                  className="h-8 rounded-md px-3 text-xs"
                  onClick={onRefreshPetSkinRegistry}
                  type="button"
                  variant="ghost"
                >
                  Refresh
                </Button>
                <Button
                  className="h-8 rounded-md px-3 text-xs"
                  disabled={!petSkinRegistry?.activeSkinIdentity}
                  onClick={onReturnPetSkinToBuiltIn}
                  type="button"
                  variant="ghost"
                >
                  Built-in
                </Button>
              </div>
            </div>
            <dl className="divide-y divide-border border-y text-[11px]">
              <Metric
                label="Active"
                tone={petSkinRegistry?.activeSkinIdentity ? "accent" : "success"}
                value={
                  petSkinRegistry?.activeSkinIdentity
                    ? `${petSkinRegistry.activeSkinIdentity.skinId} ${petSkinRegistry.activeSkinIdentity.skinVersion}`
                    : "built-in robot"
                }
              />
              <Metric
                label="Registry"
                tone={petSkinRegistry?.registryHealthy === false ? "warning" : "success"}
                value={
                  petSkinRegistry
                    ? petSkinRegistry.registryHealthy
                      ? "healthy"
                      : "fallback"
                    : "not loaded"
                }
              />
            </dl>
            <div className="mt-2 space-y-2">
              {(petSkinRegistry?.installedSkins ?? []).length === 0 ? (
                <div className="rounded-md border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                  No local pet skins installed.
                </div>
              ) : (
                petSkinRegistry?.installedSkins.map((entry) => {
                  const isActive =
                    petSkinRegistry.activeSkinIdentity?.packageDigest ===
                    entry.identity.packageDigest;
                  return (
                    <div
                      className="rounded-md border px-3 py-2"
                      data-testid="pet-skin-installed-row"
                      key={entry.identity.packageDigest}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold">
                            {entry.displayName}
                          </div>
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            {entry.identity.skinId} / {entry.identity.skinVersion}
                          </div>
                        </div>
                        <Badge
                          className="rounded-md text-[10px]"
                          variant={isActive ? "default" : "outline"}
                        >
                          {isActive ? "active" : entry.trustState}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          className="h-7 rounded-md px-2 text-[11px]"
                          disabled={isActive}
                          onClick={() => onActivatePetSkin(entry.identity)}
                          type="button"
                          variant="secondary"
                        >
                          Activate
                        </Button>
                        <Button
                          className="h-7 rounded-md px-2 text-[11px]"
                          onClick={() => onRemovePetSkin(entry.identity)}
                          type="button"
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </section>
      ) : null}
    </section>
  );
}

function PreviewGrid({
  resources,
  states,
  title,
}: {
  resources: NonNullable<
    Extract<PetSkinPreviewSelectResult, { ok: true }>["preview"]
  >["resources"];
  states: NonNullable<
    Extract<PetSkinPreviewSelectResult, { ok: true }>["preview"]
  >["states"];
  title: string;
}) {
  return (
    <div>
      <h5 className="text-[11px] font-semibold">{title}</h5>
      <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-6">
        {(Object.keys(states) as PetSkinFormalState[]).map((state) => {
          const descriptor = states[state];
          const assetId =
            descriptor.staticVariantAssetId ??
            descriptor.stateGlyphAssetId ??
            descriptor.baseAssetId;
          const resource = resources[assetId];
          return (
            <div
              className="rounded-md border bg-background px-2 py-2 text-center"
              data-testid={`pet-skin-preview-state-${state}`}
              key={state}
            >
              {resource ? (
                <img
                  alt={`${state} preview`}
                  className="mx-auto size-10 object-contain"
                  draggable={false}
                  src={resource.resourceUrl}
                />
              ) : (
                <div className="mx-auto size-10 rounded-md bg-muted" />
              )}
              <div className="mt-1 text-[10px] text-muted-foreground">
                {state}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
