import type {
  LocalPluginManifestDeveloperStatusResult,
  PluginManagementStatusResult,
} from "@jarvis-k/contracts";

import type { uiCopy } from "@/app/copy";
import { Badge } from "@/components/ui/badge";
import { Metric } from "@/components/shared/Metric";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];

export type PluginProjectionViewModel = {
  blockedPolicyPluginCount: number;
  bundledPluginCount: number;
  disabledPluginCount: number;
  enabledPluginCount: number;
  localManifestDiscovery: LocalPluginManifestDeveloperStatusResult | null;
  localManifestPluginCount: number;
  lowRiskPluginCount: number;
  mediumRiskPluginCount: number;
  pluginManagementStatus: PluginManagementStatusResult | null;
};

export function PluginProjectionPanel({
  copy,
  viewModel,
}: {
  copy: Copy;
  viewModel: PluginProjectionViewModel;
}) {
  const { localManifestDiscovery, pluginManagementStatus } = viewModel;

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Projection</h3>
        <Badge className="rounded-md text-[10px]" variant="outline">
          READ ONLY
        </Badge>
      </div>
      <dl
        className="divide-y divide-border border-y text-xs"
        data-testid="plugin-management-state-summary"
      >
        <Metric
          label="BUNDLED"
          tone="success"
          value={String(viewModel.bundledPluginCount)}
        />
        <Metric
          label="LOCAL"
          tone={viewModel.localManifestPluginCount > 0 ? "warning" : undefined}
          value={String(viewModel.localManifestPluginCount)}
        />
        <Metric
          label="ENABLED"
          tone="success"
          value={String(viewModel.enabledPluginCount)}
        />
        <Metric
          label="DISABLED"
          tone={viewModel.disabledPluginCount > 0 ? "warning" : undefined}
          value={String(viewModel.disabledPluginCount)}
        />
        <Metric
          label="LOW RISK"
          tone="success"
          value={String(viewModel.lowRiskPluginCount)}
        />
        <Metric
          label="MEDIUM RISK"
          tone={viewModel.mediumRiskPluginCount > 0 ? "warning" : undefined}
          value={String(viewModel.mediumRiskPluginCount)}
        />
        <Metric
          label="BLOCKED POLICY"
          tone={viewModel.blockedPolicyPluginCount > 0 ? "warning" : undefined}
          value={String(viewModel.blockedPolicyPluginCount)}
        />
      </dl>

      <div className="mt-5 border-y py-3 text-xs" data-testid="plugin-management-safety">
        <p className="text-muted-foreground">{copy.label.pluginSafetySummary}</p>
        <dl className="mt-3 divide-y divide-border">
          <Metric
            label={copy.label.pluginThirdPartyDefault}
            tone="warning"
            value={
              pluginManagementStatus?.defaultThirdPartyExecutionState ??
              "disabled"
            }
          />
          <Metric
            label={copy.label.pluginCodeExecution}
            tone={
              pluginManagementStatus?.thirdPartyCodeExecuted
                ? "warning"
                : "success"
            }
            value={pluginManagementStatus?.thirdPartyCodeExecuted ? "YES" : "NO"}
          />
          <Metric
            label={copy.label.pluginMarketplace}
            tone={
              pluginManagementStatus?.marketplaceAccessed
                ? "warning"
                : "success"
            }
            value={pluginManagementStatus?.marketplaceAccessed ? "YES" : "NO"}
          />
        </dl>
      </div>

      <div className="mt-5 border-y py-3 text-xs" data-testid="plugin-mcp-adapter-status">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold">MCP Adapter Alpha</h4>
          <Badge className="rounded-md text-[10px]" variant="outline">
            STATUS ONLY
          </Badge>
        </div>
        <dl className="divide-y divide-border">
          <Metric
            label="STATUS"
            tone={
              pluginManagementStatus?.mcpAdapter.status === "disabled"
                ? "warning"
                : undefined
            }
            value={pluginManagementStatus?.mcpAdapter.status ?? "unknown"}
          />
          <Metric
            label="MODE"
            value={pluginManagementStatus?.mcpAdapter.mode ?? "unknown"}
          />
          <Metric
            label="DEFAULT EXECUTION"
            tone="warning"
            value={
              pluginManagementStatus?.mcpAdapter.defaultExecutionState ??
              "disabled"
            }
          />
          <Metric
            label="SERVER STARTUP"
            tone={
              pluginManagementStatus?.mcpAdapter.externalServerStartupAllowed
                ? "warning"
                : "success"
            }
            value={
              pluginManagementStatus?.mcpAdapter.externalServerStartupAllowed
                ? "YES"
                : "NO"
            }
          />
          <Metric
            label="TOOL EXECUTION"
            tone={
              pluginManagementStatus?.mcpAdapter.externalToolExecutionAllowed
                ? "warning"
                : "success"
            }
            value={
              pluginManagementStatus?.mcpAdapter.externalToolExecutionAllowed
                ? "YES"
                : "NO"
            }
          />
          <Metric
            label="TOOL FORWARDING"
            tone={
              pluginManagementStatus?.mcpAdapter.toolCallForwardingAllowed
                ? "warning"
                : "success"
            }
            value={
              pluginManagementStatus?.mcpAdapter.toolCallForwardingAllowed
                ? "YES"
                : "NO"
            }
          />
          <Metric
            label="PERMISSION LAYER"
            tone={
              pluginManagementStatus?.mcpAdapter.permissionLayerRequired
                ? "success"
                : "warning"
            }
            value={
              pluginManagementStatus?.mcpAdapter.permissionLayerRequired
                ? "REQUIRED"
                : "MISSING"
            }
          />
          <Metric
            label="CREDENTIALS"
            tone={
              pluginManagementStatus?.mcpAdapter.credentialExposed
                ? "warning"
                : "success"
            }
            value={
              pluginManagementStatus?.mcpAdapter.credentialExposed
                ? "EXPOSED"
                : "HIDDEN"
            }
          />
          <Metric
            label="RAW OUTPUT"
            tone={
              pluginManagementStatus?.mcpAdapter.rawToolOutputPersisted
                ? "warning"
                : "success"
            }
            value={
              pluginManagementStatus?.mcpAdapter.rawToolOutputPersisted
                ? "PERSISTED"
                : "NO"
            }
          />
        </dl>
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {(
            pluginManagementStatus?.mcpAdapter.reasonCodes ?? [
              "MCP_ADAPTER_STATUS_PENDING",
            ]
          ).map((reason) => (
            <Badge
              className="rounded-md text-[10px] text-muted-foreground"
              data-testid="plugin-mcp-adapter-reason"
              key={reason}
              variant="outline"
            >
              {reason}
            </Badge>
          ))}
        </div>
      </div>

      <div
        className="mt-5 border-y py-3 text-xs"
        data-testid="local-plugin-manifest-developer-status"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold">Local Manifest DX</h4>
          <Badge className="rounded-md text-[10px]" variant="outline">
            LIST ONLY
          </Badge>
        </div>
        <dl className="divide-y divide-border">
          <Metric
            label="DISCOVERY"
            tone={
              localManifestDiscovery?.discoveryStatus === "configured"
                ? "success"
                : localManifestDiscovery?.discoveryStatus === "degraded"
                  ? "warning"
                  : undefined
            }
            value={localManifestDiscovery?.discoveryStatus ?? "unknown"}
          />
          <Metric
            label="ENABLED"
            tone={localManifestDiscovery?.enabled ? "success" : "warning"}
            value={localManifestDiscovery?.enabled ? "YES" : "NO"}
          />
          <Metric
            label="CONFIGURED DIRS"
            value={String(localManifestDiscovery?.configuredDirectoryCount ?? 0)}
          />
          <Metric
            label="SCANNED DIRS"
            value={String(localManifestDiscovery?.scannedDirectoryCount ?? 0)}
          />
          <Metric
            label="VALID MANIFESTS"
            tone={
              (localManifestDiscovery?.validManifestCount ?? 0) > 0
                ? "success"
                : undefined
            }
            value={String(localManifestDiscovery?.validManifestCount ?? 0)}
          />
          <Metric
            label="INVALID MANIFESTS"
            tone={
              (localManifestDiscovery?.invalidManifestCount ?? 0) > 0
                ? "warning"
                : "success"
            }
            value={String(localManifestDiscovery?.invalidManifestCount ?? 0)}
          />
          <Metric
            label="RAW PATHS"
            tone={localManifestDiscovery?.rawPathsExposed ? "warning" : "success"}
            value={localManifestDiscovery?.rawPathsExposed ? "EXPOSED" : "HIDDEN"}
          />
          <Metric
            label="UNKNOWN CODE"
            tone={
              localManifestDiscovery?.thirdPartyCodeExecuted
                ? "warning"
                : "success"
            }
            value={
              localManifestDiscovery?.thirdPartyCodeExecuted ? "EXECUTED" : "NO"
            }
          />
          <Metric
            label="INSTALL/ENABLE"
            tone={
              localManifestDiscovery?.installOrEnableActionExposed
                ? "warning"
                : "success"
            }
            value={
              localManifestDiscovery?.installOrEnableActionExposed
                ? "EXPOSED"
                : "NO"
            }
          />
          <Metric
            label="STATE TOGGLE"
            tone={
              localManifestDiscovery?.stateToggleActionExposed
                ? "success"
                : undefined
            }
            value={
              localManifestDiscovery?.stateToggleActionExposed
                ? "STATE_ONLY"
                : "NO"
            }
          />
        </dl>

        <div className="mt-3 grid gap-2">
          {localManifestDiscovery?.directories.length ? (
            localManifestDiscovery.directories.map((directory) => (
              <div
                className="border-t pt-2"
                data-testid="local-plugin-manifest-directory-status"
                key={directory.directoryRef}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {directory.pluginName ?? directory.directoryRef}
                    </div>
                    <div className="mt-1 truncate text-[10px] text-muted-foreground">
                      {directory.pluginId ?? directory.directoryRef}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      {directory.directoryRef}
                    </Badge>
                    <Badge
                      className={cn(
                        "rounded-md text-[10px]",
                        directory.state === "discovered"
                          ? "text-success"
                          : "text-warning",
                      )}
                      variant="outline"
                    >
                      {directory.state}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {directory.issueCodes.length > 0 ? (
                    directory.issueCodes.map((issue) => (
                      <Badge
                        className="rounded-md text-[10px] text-warning"
                        data-testid="local-plugin-manifest-issue"
                        key={`${directory.directoryRef}-${issue}`}
                        variant="outline"
                      >
                        {issue}
                      </Badge>
                    ))
                  ) : (
                    <Badge
                      className="rounded-md text-[10px] text-success"
                      data-testid="local-plugin-manifest-issue"
                      variant="outline"
                    >
                      MANIFEST_VALID
                    </Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="border-t pt-2 text-[10px] text-muted-foreground">
              Local manifest directories are not visible.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
