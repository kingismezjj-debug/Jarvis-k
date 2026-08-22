import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import type {
  PetSkinFormalState,
  PetSkinIdentity,
  PetSkinPreviewSelectResult,
  PetSkinRegistryProjection,
  PetSkinStudioMetadataUpdateRequest,
  PetSkinStudioResult,
  PetSkinStudioSelectAssetRequest,
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
  petSkinStudioLoading,
  petSkinStudioResult,
  onActivatePetSkin,
  onCancelPetSkinPreview,
  onExportPetSkinStudioDraft,
  onInstallPetSkinPreview,
  onOpenPetSkinStudioExportFolder,
  onPreviewPetSkinStudioDraft,
  onRefreshPetSkinRegistry,
  onResetPetSkinStudioDraft,
  onRemovePetSkin,
  onReturnPetSkinToBuiltIn,
  onSelectTheme,
  onSelectPetSkinPreview,
  onSelectPetSkinStudioAsset,
  onUpdatePetSkinStudioMetadata,
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
  petSkinStudioLoading: boolean;
  petSkinStudioResult: PetSkinStudioResult | null;
  onActivatePetSkin: (identity: PetSkinIdentity) => void;
  onCancelPetSkinPreview: () => void;
  onExportPetSkinStudioDraft: () => void;
  onInstallPetSkinPreview: () => void;
  onOpenPetSkinStudioExportFolder: (exportId: string) => void;
  onPreviewPetSkinStudioDraft: () => void;
  onRefreshPetSkinRegistry: () => void;
  onResetPetSkinStudioDraft: () => void;
  onRemovePetSkin: (identity: PetSkinIdentity) => void;
  onReturnPetSkinToBuiltIn: () => void;
  onSelectTheme: (themeId: SkinThemeId) => void;
  onSelectPetSkinPreview: () => void;
  onSelectPetSkinStudioAsset: (
    request: PetSkinStudioSelectAssetRequest,
  ) => void;
  onUpdatePetSkinStudioMetadata: (
    request: PetSkinStudioMetadataUpdateRequest,
  ) => void;
  showPetSkinPreview: boolean;
  storageKey: string;
  themes: AppearanceThemeOption[];
}) {
  const preview = petSkinPreviewResult?.ok ? petSkinPreviewResult.preview : null;
  const previewError =
    petSkinPreviewResult && !petSkinPreviewResult.ok ? petSkinPreviewResult : null;
  const studioDraft = petSkinStudioResult?.draft ?? null;
  const studioError =
    petSkinStudioResult && !petSkinStudioResult.ok ? petSkinStudioResult : null;
  const studioExport =
    petSkinStudioResult?.ok && petSkinStudioResult.export
      ? petSkinStudioResult.export
      : null;
  const [studioMetadata, setStudioMetadata] =
    useState<PetSkinStudioMetadataUpdateRequest>({
      displayName: "My Jarvis-K Pet Skin",
      description: "Local asset-only pet skin.",
      author: "Local User",
      license: "Personal Use",
      skinVersion: "1.0.0",
    });

  useEffect(() => {
    if (studioDraft) {
      setStudioMetadata(studioDraft.metadata);
    }
  }, [studioDraft]);

  const submitStudioMetadata = () => {
    onUpdatePetSkinStudioMetadata(studioMetadata);
  };

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
          <section
            className="mt-4 border-t pt-3"
            data-testid="pet-skin-studio-panel"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-xs font-semibold">Pet Skin Studio</h4>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                  Builds a local asset-only .jkskin package. Exported skins still
                  go through the normal import and validation flow.
                </p>
              </div>
              <Badge className="rounded-md text-[10px]" variant="outline">
                local_file
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1.2fr]">
              <div className="space-y-3">
                <div className="rounded-md border px-3 py-3">
                  <h5 className="text-[11px] font-semibold">
                    1. Basic Information
                  </h5>
                  <div className="mt-2 grid gap-2">
                    <StudioField
                      label="Display name"
                      value={studioMetadata.displayName}
                      onChange={(value) =>
                        setStudioMetadata((current) => ({
                          ...current,
                          displayName: value,
                        }))
                      }
                    />
                    <StudioField
                      label="Author"
                      value={studioMetadata.author}
                      onChange={(value) =>
                        setStudioMetadata((current) => ({
                          ...current,
                          author: value,
                        }))
                      }
                    />
                    <StudioField
                      label="License"
                      value={studioMetadata.license}
                      onChange={(value) =>
                        setStudioMetadata((current) => ({
                          ...current,
                          license: value,
                        }))
                      }
                    />
                    <StudioField
                      label="Version"
                      value={studioMetadata.skinVersion}
                      onChange={(value) =>
                        setStudioMetadata((current) => ({
                          ...current,
                          skinVersion: value,
                        }))
                      }
                    />
                    <label className="grid gap-1 text-[10px] text-muted-foreground">
                      Description
                      <textarea
                        className="min-h-[62px] resize-none rounded-md border bg-background px-2 py-1 text-xs text-foreground"
                        maxLength={240}
                        value={studioMetadata.description ?? ""}
                        onChange={(event) =>
                          setStudioMetadata((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <Button
                      className="h-8 rounded-md px-3 text-xs"
                      onClick={submitStudioMetadata}
                      type="button"
                      variant="secondary"
                    >
                      Save metadata
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border px-3 py-3">
                  <h5 className="text-[11px] font-semibold">4. Export</h5>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    Export writes a .jkskin file, reopens it with the official
                    reader, and does not install or activate it.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      className="h-8 rounded-md px-3 text-xs"
                      disabled={!studioDraft?.readyForExport || petSkinStudioLoading}
                      onClick={onExportPetSkinStudioDraft}
                      type="button"
                      variant="secondary"
                    >
                      Export .jkskin
                    </Button>
                    <Button
                      className="h-8 rounded-md px-3 text-xs"
                      onClick={onResetPetSkinStudioDraft}
                      type="button"
                      variant="ghost"
                    >
                      Reset draft
                    </Button>
                  </div>
                  {studioExport ? (
                    <dl className="mt-3 divide-y divide-border border-y text-[11px]">
                      <Metric label="File" tone="success" value={studioExport.fileName} />
                      <Metric
                        label="Validation"
                        tone="success"
                        value={studioExport.validationStatus}
                      />
                      <Metric
                        label="Package digest"
                        tone="accent"
                        value={studioExport.packageDigest.slice(0, 12)}
                      />
                      <Metric label="Size" value={`${studioExport.byteLength} B`} />
                      <div className="py-2">
                        <Button
                          className="h-7 rounded-md px-2 text-[11px]"
                          onClick={() =>
                            onOpenPetSkinStudioExportFolder(studioExport.exportId)
                          }
                          type="button"
                          variant="ghost"
                        >
                          Open containing folder
                        </Button>
                      </div>
                    </dl>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-md border px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-[11px] font-semibold">
                      2. Visual Assets
                    </h5>
                    <Badge
                      className="rounded-md text-[10px]"
                      variant={studioDraft?.readyForPreview ? "default" : "outline"}
                    >
                      {studioDraft?.readyForPreview ? "complete" : "incomplete"}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-2">
                    {PET_SKIN_STUDIO_STATES.map((state) => {
                      const stateDraft = studioDraft?.states[state];
                      return (
                        <div
                          className="rounded-md border bg-background px-2 py-2"
                          key={state}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold">
                              {state}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {stateDraft?.complete ? "visual" : "missing"} /{" "}
                              {stateDraft?.reducedMotionComplete
                                ? "reduced"
                                : "needs static"}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {PET_SKIN_STUDIO_ROLES.map((role) => (
                              <Button
                                className="h-7 rounded-md px-2 text-[11px]"
                                disabled={petSkinStudioLoading}
                                key={role}
                                onClick={() =>
                                  onSelectPetSkinStudioAsset({
                                    state,
                                    role,
                                    source: "local_file",
                                  })
                                }
                                type="button"
                                variant="ghost"
                              >
                                {role === "base"
                                  ? "Base"
                                  : role === "stateGlyph"
                                    ? "Glyph"
                                    : "Static"}
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(studioDraft?.validationIssues.length ?? 0) > 0 ? (
                    <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-muted-foreground">
                      {studioDraft?.validationIssues.slice(0, 4).join(" / ")}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-md border px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-[11px] font-semibold">3. Preview</h5>
                    <Button
                      className="h-8 rounded-md px-3 text-xs"
                      disabled={!studioDraft?.readyForPreview || petSkinStudioLoading}
                      onClick={onPreviewPetSkinStudioDraft}
                      type="button"
                      variant="secondary"
                    >
                      Preview draft
                    </Button>
                  </div>
                  {petSkinStudioResult?.ok && petSkinStudioResult.preview ? (
                    <div className="mt-3 space-y-3">
                      <PreviewGrid
                        states={petSkinStudioResult.preview.states}
                        resources={petSkinStudioResult.preview.resources}
                        title="Studio normal motion"
                      />
                      <PreviewGrid
                        states={petSkinStudioResult.preview.reducedMotionStates}
                        resources={petSkinStudioResult.preview.resources}
                        title="Studio reduced motion"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 rounded-md border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                      Preview is local and temporary; it will not change the
                      active Desktop Pet.
                    </div>
                  )}
                </div>
              </div>
            </div>
            {studioError ? (
              <div
                className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[11px]"
                data-testid="pet-skin-studio-error"
              >
                <span className="font-semibold">{studioError.reasonCode}</span>
                <span className="ml-2 text-muted-foreground">
                  {studioError.safeMessage}
                </span>
              </div>
            ) : null}
          </section>
        </section>
      ) : null}
    </section>
  );
}

const PET_SKIN_STUDIO_STATES = [
  "idle",
  "listening",
  "thinking",
  "success",
  "error",
  "offline",
] as const satisfies readonly PetSkinFormalState[];

const PET_SKIN_STUDIO_ROLES = [
  "base",
  "stateGlyph",
  "staticVariant",
] as const;

function StudioField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-[10px] text-muted-foreground">
      {label}
      <input
        className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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
