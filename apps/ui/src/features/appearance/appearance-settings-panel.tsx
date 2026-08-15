import { Palette } from "lucide-react";

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
  onSelectTheme,
  storageKey,
  themes,
}: {
  activeTheme: AppearanceThemeOption;
  copy: Copy;
  currentThemeId: SkinThemeId;
  onSelectTheme: (themeId: SkinThemeId) => void;
  storageKey: string;
  themes: AppearanceThemeOption[];
}) {
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
    </section>
  );
}
