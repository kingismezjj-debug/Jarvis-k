import { useState } from "react";
import type {
  GlmAdvancedBrainAcceptanceDiagnosticReport,
  GlmAdvancedBrainAcceptanceModelId,
  GlmAdvancedBrainAcceptancePreflightResult,
  GlmAdvancedBrainAcceptanceStatus,
} from "@jarvis-k/contracts";
import { GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE } from "@jarvis-k/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface GlmAdvancedBrainAcceptancePanelProps {
  readonly actions: {
    readonly deleteCredential: () => void;
    readonly preflight: () => void;
    readonly refreshStatus: () => void;
    readonly runDiagnostic: () => void;
    readonly saveCredential: (secret: string) => void;
    readonly setModel: (modelId: GlmAdvancedBrainAcceptanceModelId | null) => void;
  };
  readonly preflightResult: GlmAdvancedBrainAcceptancePreflightResult | null;
  readonly report: GlmAdvancedBrainAcceptanceDiagnosticReport | null;
  readonly sending: boolean;
  readonly status: GlmAdvancedBrainAcceptanceStatus | null;
}

export function GlmAdvancedBrainAcceptancePanel({
  actions,
  preflightResult,
  report,
  sending,
  status,
}: GlmAdvancedBrainAcceptancePanelProps) {
  const [draftKey, setDraftKey] = useState("");
  const [platformKeyConfirmed, setPlatformKeyConfirmed] = useState(false);
  if (!status?.acceptanceFlagEnabled) {
    return null;
  }
  const configured = status?.credentialConfigured === true;
  const selectedModel = status?.selectedModelId ?? "";
  const canRun = preflightResult?.allowRealAcceptance === true;

  const confirmRun = () => {
    const accepted = window.confirm(
      [
        "Run GLM Advanced Brain real acceptance diagnostic?",
        `Provider: GLM`,
        `Model: ${selectedModel || "not selected"}`,
        "Endpoint: official standard_paas_v4 profile",
        "Credential type: Zhipu Open Platform API key confirmed",
        "Cloud request: YES",
        "Fixed diagnostic input: YES",
        "User content included: NO",
        "Tool execution: NO",
        "Retry: NO",
        "Maximum output tokens: 64",
        "This one-time diagnostic may produce a small API charge.",
        "",
        "Only this fixed acceptance request will be sent if all preflight checks pass.",
      ].join("\n"),
    );
    if (accepted) {
      actions.runDiagnostic();
    }
  };

  return (
    <section
      className="mt-5 min-w-0 border-t pt-5"
      data-testid="glm-advanced-brain-acceptance-panel"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">GLM Advanced Brain acceptance</h3>
          <p className="text-xs text-muted-foreground">
            One-time fixed diagnostic / no user prompt / no tools
          </p>
        </div>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {status?.acceptanceFlagEnabled ? "FLAG ON" : "LOADING"}
        </Badge>
      </div>

      <dl className="mb-3 divide-y divide-border border-y text-[11px]">
        <MetricRow label="provider" value={status?.providerId ?? "unknown"} />
        <MetricRow
          label="provider enabled"
          value={status?.providerEnabled ? "YES" : "NO"}
        />
        <MetricRow
          label="model"
          value={status?.selectedModelId ?? "not selected"}
        />
        <MetricRow
          label="credential"
          value={configured ? "configured" : "missing"}
        />
        <MetricRow
          label="credential binding"
          value={status?.credentialBindingId ?? "unknown"}
        />
        <MetricRow
          label="credential storage"
          value={status?.credentialStorageEncrypted ? "encrypted" : "none"}
        />
        <MetricRow
          label="credential type"
          value={status?.credentialTypeConfirmed ?? "unconfirmed"}
        />
        <MetricRow
          label="secure store"
          value={status?.secureStorageAvailable ? "available" : "unavailable"}
        />
        <MetricRow
          label="endpoint"
          value={status?.officialEndpointProfile ? "official" : "mismatch"}
        />
        <MetricRow
          label="endpoint origin"
          value={status?.endpointOrigin ?? "unknown"}
        />
        <MetricRow
          label="operation path"
          value={status?.operationPath ?? "unknown"}
        />
        <MetricRow
          label="full endpoint match"
          value={status?.fullEndpointMatch ? "YES" : "NO"}
        />
        <MetricRow
          label="reasons"
          value={(status?.reasonCodes ?? ["loading"]).join(", ")}
        />
      </dl>

      <div className="mb-3 flex flex-wrap gap-2">
        {(["glm-5.2", "glm-5.3"] as const).map((modelId) => (
          <Button
            className="h-8 rounded-md px-2.5 text-xs"
            disabled={sending}
            key={modelId}
            onClick={() => actions.setModel(modelId)}
            type="button"
            variant={selectedModel === modelId ? "default" : "outline"}
          >
            {modelId}
          </Button>
        ))}
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          disabled={sending || !selectedModel}
          onClick={() => actions.setModel(null)}
          type="button"
          variant="ghost"
        >
          Clear model
        </Button>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          aria-label="GLM Advanced Brain API key"
          className="h-8 min-w-0 rounded-md border bg-background px-2 text-xs"
          disabled={sending}
          onChange={(event) => setDraftKey(event.currentTarget.value)}
          placeholder={configured ? "Credential configured" : "Paste API key"}
          type="password"
          value={draftKey}
        />
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          disabled={
            sending || draftKey.trim().length < 8 || !platformKeyConfirmed
          }
          onClick={() => {
            actions.saveCredential(draftKey);
            setDraftKey("");
            setPlatformKeyConfirmed(false);
          }}
          type="button"
          variant="outline"
        >
          Save key
        </Button>
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          disabled={sending || !configured}
          onClick={actions.deleteCredential}
          type="button"
          variant="ghost"
        >
          Delete key
        </Button>
      </div>
      <label className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
        <input
          checked={platformKeyConfirmed}
          className="mt-0.5"
          disabled={sending}
          onChange={(event) =>
            setPlatformKeyConfirmed(event.currentTarget.checked)
          }
          type="checkbox"
        />
        <span>
          This is a Zhipu Open Platform API key (
          {GLM_ADVANCED_BRAIN_ACCEPTANCE_CREDENTIAL_TYPE}), not a Coding Plan key.
        </span>
      </label>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          disabled={sending}
          onClick={actions.refreshStatus}
          type="button"
          variant="outline"
        >
          Refresh
        </Button>
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          disabled={sending}
          onClick={actions.preflight}
          type="button"
          variant="outline"
        >
          Preflight
        </Button>
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          disabled={sending || !canRun}
          onClick={confirmRun}
          type="button"
          variant="default"
        >
          Run fixed diagnostic
        </Button>
      </div>

      {preflightResult ? (
        <dl className="mb-3 divide-y divide-border border-y text-[11px]">
          <MetricRow
            label="allow"
            value={preflightResult.allowRealAcceptance ? "YES" : "NO"}
          />
          <MetricRow
            label="allow single real acceptance"
            value={preflightResult.allowSingleRealAcceptance ? "YES" : "NO"}
          />
          <MetricRow
            label="endpoint profile"
            value={preflightResult.endpointProfileId}
          />
          <MetricRow
            label="endpoint origin"
            value={preflightResult.endpointOrigin}
          />
          <MetricRow
            label="operation path"
            value={preflightResult.operationPath}
          />
          <MetricRow
            label="full endpoint match"
            value={preflightResult.fullEndpointMatch ? "YES" : "NO"}
          />
          <MetricRow
            label="credential binding"
            value={preflightResult.credentialBindingId}
          />
          <MetricRow
            label="credential configured"
            value={preflightResult.credentialConfigured ? "YES" : "NO"}
          />
          <MetricRow
            label="credential encrypted"
            value={preflightResult.credentialStorageEncrypted ? "YES" : "NO"}
          />
          <MetricRow
            label="credential type"
            value={preflightResult.credentialTypeConfirmed ?? "unconfirmed"}
          />
          <MetricRow
            label="selected model explicit"
            value={preflightResult.selectedModelExplicit ? "YES" : "NO"}
          />
          <MetricRow
            label="fixed input"
            value={
              preflightResult.cloudRequestFixed &&
              preflightResult.requestBodyFixed
                ? "YES"
                : "NO"
            }
          />
          <MetricRow
            label="max tokens"
            value={String(preflightResult.maxOutputTokens)}
          />
          <MetricRow
            label="streaming"
            value={preflightResult.streaming ? "YES" : "NO"}
          />
          <MetricRow
            label="no tools"
            value={
              !preflightResult.toolsEnabled &&
              preflightResult.toolCapabilityCount === 0
                ? "YES"
                : "NO"
            }
          />
          <MetricRow
            label="retry/fallback"
            value={
              !preflightResult.retryEnabled && !preflightResult.fallbackEnabled
                ? "OFF"
                : "ON"
            }
          />
          <MetricRow
            label="executor reachable"
            value={preflightResult.executorReachable ? "YES" : "NO"}
          />
          <MetricRow
            label="prior real requests"
            value={String(preflightResult.priorRealRequestCount)}
          />
          <MetricRow
            label="real request attempted"
            value={preflightResult.realRequestAttempted ? "YES" : "NO"}
          />
          <MetricRow
            label="reasons"
            value={preflightResult.reasonCodes.join(", ")}
          />
        </dl>
      ) : null}

      {report ? (
        <dl className="divide-y divide-border border-y text-[11px]">
          <MetricRow label="acceptance id" value={report.acceptanceId} />
          <MetricRow label="result" value={report.structuredResultValidation} />
          <MetricRow label="status" value={report.httpStatusClass} />
          <MetricRow
            label="request sent"
            value={report.requestSent ? "YES" : "NO"}
          />
          <MetricRow
            label="response completed"
            value={report.responseCompleted ? "YES" : "NO"}
          />
          <MetricRow
            label="response bytes"
            value={String(report.responseByteCount)}
          />
          <MetricRow
            label="consumed"
            value={report.acceptanceConsumed ? "YES" : "NO"}
          />
          <MetricRow label="latency" value={`${report.latencyMs} ms`} />
          <MetricRow
            label="tokens"
            value={`${report.tokenUsage.totalTokens} total`}
          />
          <MetricRow label="retry" value={String(report.retryCount)} />
          <MetricRow label="fallback" value={String(report.fallbackCount)} />
          <MetricRow label="tool calls" value={String(report.toolCallCount)} />
          <MetricRow label="reason" value={report.reasonCode} />
        </dl>
      ) : null}
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all text-right font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}
