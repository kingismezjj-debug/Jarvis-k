import type {
  LocalPluginManifestDeveloperStatusResult,
  PluginManagementStatusResult,
} from "@jarvis-k/contracts";
import { Check, RefreshCw, X } from "lucide-react";

import type { uiCopy } from "@/app/copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";
import { PluginProjectionPanel } from "./plugin-projection-panel";

type Copy = (typeof uiCopy)["en"];
type PluginRecord = PluginManagementStatusResult["plugins"][number];

export type PluginManagementViewModel = {
  blockedPolicyPluginCount: number;
  bundledPluginCount: number;
  disabledPluginCount: number;
  enabledPluginCount: number;
  localManifestDiscovery: LocalPluginManifestDeveloperStatusResult | null;
  localManifestPluginCount: number;
  localPluginStateUpdatingId: string | null;
  lowRiskPluginCount: number;
  mediumRiskPluginCount: number;
  pluginManagementStatus: PluginManagementStatusResult | null;
  plugins: PluginRecord[];
};

export type PluginManagementActions = {
  refresh: () => void;
  toggleLocalPluginState: (plugin: PluginRecord) => void;
};

export function PluginManagementView({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: PluginManagementActions;
  copy: Copy;
  sending: boolean;
  viewModel: PluginManagementViewModel;
}) {
  return (
    <div
      className="grid gap-5 px-8 py-7 lg:grid-cols-[minmax(0,1fr)_320px]"
      data-testid="plugins-view"
    >
      <section className="min-w-0" data-testid="plugin-management-panel">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">{copy.view.plugins}</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Refresh plugins"
                className="size-8 rounded-md"
                data-testid="refresh-plugins"
                disabled={sending}
                onClick={actions.refresh}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <RefreshCw
                  className={cn("size-3.5", sending && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh plugins</TooltipContent>
          </Tooltip>
        </div>

        <div className="grid gap-3">
          {viewModel.plugins.length === 0 ? (
            <div className="border-y py-5 text-xs text-muted-foreground">
              {copy.label.noPlugins}
            </div>
          ) : (
            viewModel.plugins.map((plugin) => (
              <PluginCard
                actions={actions}
                copy={copy}
                key={plugin.manifest.id}
                localPluginStateUpdatingId={
                  viewModel.localPluginStateUpdatingId
                }
                plugin={plugin}
              />
            ))
          )}
        </div>
      </section>

      <PluginProjectionPanel
        copy={copy}
        viewModel={{
          blockedPolicyPluginCount: viewModel.blockedPolicyPluginCount,
          bundledPluginCount: viewModel.bundledPluginCount,
          disabledPluginCount: viewModel.disabledPluginCount,
          enabledPluginCount: viewModel.enabledPluginCount,
          localManifestDiscovery: viewModel.localManifestDiscovery,
          localManifestPluginCount: viewModel.localManifestPluginCount,
          lowRiskPluginCount: viewModel.lowRiskPluginCount,
          mediumRiskPluginCount: viewModel.mediumRiskPluginCount,
          pluginManagementStatus: viewModel.pluginManagementStatus,
        }}
      />
    </div>
  );
}

function PluginCard({
  actions,
  copy,
  localPluginStateUpdatingId,
  plugin,
}: {
  actions: PluginManagementActions;
  copy: Copy;
  localPluginStateUpdatingId: string | null;
  plugin: PluginRecord;
}) {
  return (
    <article
      className="rounded-md border bg-card/40 p-3 text-xs"
      data-testid="plugin-card"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{plugin.manifest.name}</div>
          <div className="mt-1 truncate text-[10px] text-muted-foreground">
            {plugin.manifest.id}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge
            className={cn(
              "rounded-md text-[10px]",
              plugin.state === "enabled" && "text-success",
              plugin.state === "disabled" && "text-warning",
            )}
            variant="outline"
          >
            {plugin.state}
          </Badge>
          <Badge className="rounded-md text-[10px]" variant="outline">
            {plugin.source}
          </Badge>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
        <Metric
          label={copy.label.pluginCapabilities}
          value={String(plugin.manifest.capabilities.length)}
        />
        <Metric
          label={copy.label.pluginPermissions}
          value={String(plugin.manifest.permissions?.length ?? 0)}
        />
        <Metric
          label={copy.label.pluginDeclaredRisk}
          tone={
            plugin.riskAssessment.declaredRiskTier === "low"
              ? "success"
              : "warning"
          }
          value={plugin.riskAssessment.declaredRiskTier}
        />
        <Metric
          label={copy.label.pluginEffectiveRisk}
          tone={
            plugin.riskAssessment.effectiveRiskTier === "low"
              ? "success"
              : "warning"
          }
          value={plugin.riskAssessment.effectiveRiskTier}
        />
        <Metric
          label={copy.label.pluginConfirmationPolicy}
          tone={
            plugin.riskAssessment.confirmationPolicy === "none"
              ? "success"
              : "warning"
          }
          value={plugin.riskAssessment.confirmationPolicy}
        />
        <Metric
          label={copy.label.pluginExecutionMode}
          value={plugin.executionMode}
        />
        <Metric
          label={copy.label.pluginRouteSelectable}
          tone={plugin.routeSelectable ? "success" : "warning"}
          value={plugin.routeSelectable ? "YES" : "NO"}
        />
        <Metric
          label={copy.label.pluginRuntime}
          value={plugin.manifest.runtime}
        />
        <Metric
          label={copy.label.pluginVersion}
          value={plugin.manifest.version}
        />
        <Metric
          label={copy.label.pluginStatePersistence}
          tone={plugin.statePersisted ? "success" : undefined}
          value={plugin.statePersisted ? plugin.stateSource : "not_persisted"}
        />
      </dl>

      {plugin.source === "local_manifest" ? (
        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-[10px]">
          <span className="min-w-0 truncate text-muted-foreground">
            {copy.label.pluginStateToggle}:{" "}
            {plugin.stateToggleAvailable ? "state_only" : "unavailable"}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="local-plugin-state-toggle"
                disabled={
                  !plugin.stateToggleAvailable ||
                  localPluginStateUpdatingId === plugin.manifest.id
                }
                onClick={() => actions.toggleLocalPluginState(plugin)}
                size="xs"
                type="button"
                variant="outline"
              >
                {plugin.state === "enabled" ? (
                  <X data-icon="inline-start" />
                ) : (
                  <Check data-icon="inline-start" />
                )}
                {plugin.state === "enabled" ? "Disable state" : "Enable state"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Persist local manifest state only</TooltipContent>
          </Tooltip>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        {plugin.riskAssessment.capabilityStatuses.map((capability) => (
          <Badge
            className="rounded-md text-[10px]"
            data-testid="plugin-capability"
            key={capability.capability}
            variant="outline"
          >
            {capability.capability} / {capability.riskTier}
          </Badge>
        ))}
      </div>

      {plugin.riskAssessment.permissionStatuses.length > 0 ? (
        <div className="mt-3 grid gap-2 border-t pt-3">
          {plugin.riskAssessment.permissionStatuses.map((permission, index) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_110px_140px] items-center gap-2 text-[10px]"
              data-testid="plugin-permission-status"
              key={`${permission.category}-${index}`}
            >
              <span className="truncate font-medium">
                {permission.category}
              </span>
              <span
                className={cn(
                  "truncate",
                  permission.riskTier === "low"
                    ? "text-success"
                    : "text-warning",
                )}
              >
                {permission.riskTier}
              </span>
              <span className="truncate text-right text-muted-foreground">
                {permission.permissionState}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="mt-3 border-t pt-3 text-[10px] text-muted-foreground"
          data-testid="plugin-permission-status"
        >
          {copy.label.pluginPermissionGate}: NO_DECLARED_PERMISSIONS
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        {plugin.riskAssessment.reasonCodes.map((reason) => (
          <Badge
            className="rounded-md text-[10px]"
            data-testid="plugin-risk-reason"
            key={reason}
            variant="outline"
          >
            {reason}
          </Badge>
        ))}
      </div>

      {plugin.reasonCodes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {plugin.reasonCodes.map((reason) => (
            <Badge
              className="rounded-md text-[10px] text-muted-foreground"
              key={reason}
              variant="outline"
            >
              {reason}
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  );
}
