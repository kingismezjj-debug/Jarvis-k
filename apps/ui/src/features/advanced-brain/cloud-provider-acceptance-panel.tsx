import { useState } from "react";
import type {
  CloudProviderAcceptanceDiagnosticReport,
  CloudProviderAcceptancePreflightResult,
  CloudProviderAcceptanceStatus,
} from "@jarvis-k/contracts";
import {
  CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
  CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID,
} from "@jarvis-k/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CloudProviderAcceptancePanelProps {
  readonly actions: {
    readonly deleteCredential: () => void;
    readonly preflight: () => void;
    readonly refreshStatus: () => void;
    readonly runFakeAcceptance: () => void;
    readonly runRealAcceptance: () => void;
    readonly saveCredential: (secret: string) => void;
  };
  readonly preflightResult: CloudProviderAcceptancePreflightResult | null;
  readonly report: CloudProviderAcceptanceDiagnosticReport | null;
  readonly sending: boolean;
  readonly status: CloudProviderAcceptanceStatus | null;
}

export function CloudProviderAcceptancePanel({
  actions,
  preflightResult,
  report,
  sending,
  status,
}: CloudProviderAcceptancePanelProps) {
  const [draftKey, setDraftKey] = useState("");
  const [platformKeyConfirmed, setPlatformKeyConfirmed] = useState(false);
  if (!status?.capabilityFlagEnabled) {
    return null;
  }

  const profile = status.profiles[0];
  const credential =
    status.credentialStatuses.find(
      (entry) => entry.bindingId === CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID,
    ) ?? status.credentialStatuses[0];
  const configured = credential?.configured === true;
  const canRunFake =
    preflightResult?.acceptanceId ===
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID &&
    status.ledger.acceptanceId === CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID &&
    status.ledger.consumed === false &&
    preflightResult.allowFakeAcceptance === true &&
    preflightResult.allowSingleRealAcceptance === false &&
    preflightResult.realNetworkRequestSent === false;
  const canRunReal =
    preflightResult?.acceptanceId ===
      CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID &&
    status.ledger.acceptanceId === CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_FLASH_ID &&
    status.ledger.consumed === false &&
    preflightResult.allowSingleRealAcceptance === true &&
    preflightResult.consumed === false &&
    preflightResult.realNetworkRequestSent === false;

  const confirmFakeRun = () => {
    const accepted = window.confirm(
      [
        "Run DeepSeek fake acceptance diagnostic?",
        `Acceptance ID: ${preflightResult?.acceptanceId ?? "unavailable"}`,
        "Provider: DeepSeek",
        "Model: deepseek-v4-flash",
        "Endpoint: official deepseek-standard-chat-completions profile",
        "Cloud request: NO",
        "Fake transport: YES",
        "User content included: NO",
        "Tool execution: NO",
        "Retry: NO",
        `Max tokens: ${preflightResult?.maxTokens ?? "unavailable"}`,
        "",
         "No real API request or charge will occur in this phase.",
         "No user content is included.",
      ].join("\n"),
    );
    if (accepted) {
      actions.runFakeAcceptance();
    }
  };
  const confirmRealRun = () => {
    const accepted = window.confirm(
      [
        "Run one-time DeepSeek real acceptance diagnostic?",
        `Acceptance ID: ${preflightResult?.acceptanceId ?? "unavailable"}`,
        `Acceptance version: ${preflightResult?.acceptanceVersion ?? "unavailable"}`,
        "Provider: DeepSeek",
        "Model: deepseek-v4-flash",
        "Endpoint: official DeepSeek API",
        "Mode: no-thinking streaming",
        `Max output: ${preflightResult?.maxTokens ?? "unavailable"}`,
        `Overall timeout: ${preflightResult?.timeoutOverallMs ?? "unavailable"} ms`,
        "Fixed diagnostic only: YES",
        "User content included: NO",
        "Tool execution: NO",
        "Retry: NO",
        "Fallback: NO",
        "Product routing disabled: YES",
        "",
        "This may produce a small API fee and is consumed on attempt.",
      ].join("\n"),
    );
    if (accepted) {
      actions.runRealAcceptance();
    }
  };

  return (
    <section
      className="mt-5 min-w-0 border-t pt-5"
      data-testid="cloud-provider-acceptance-panel"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Cloud Provider Acceptance</h3>
          <p className="text-xs text-muted-foreground">
            DeepSeek single real acceptance gate / fixed diagnostic / no product routing
          </p>
        </div>
        <Badge className="rounded-md text-[10px]" variant="outline">
          DEEPSEEK
        </Badge>
      </div>

      <dl className="mb-3 divide-y divide-border border-y text-[11px]">
        <MetricRow label="acceptance id" value={status.ledger.acceptanceId} />
        <MetricRow
          label="acceptance version"
          value={String(status.ledger.acceptanceVersion)}
        />
        <MetricRow label="state" value={status.ledger.state} />
        <MetricRow label="provider" value={profile?.providerId ?? "unknown"} />
        <MetricRow label="model" value={profile?.modelId ?? "unknown"} />
        <MetricRow
          label="request contract"
          value={profile?.requestContractId ?? "unknown"}
        />
        <MetricRow
          label="credential binding"
          value={credential?.bindingId ?? "unknown"}
        />
        <MetricRow
          label="credential"
          value={configured ? "configured" : "missing"}
        />
        <MetricRow
          label="credential encrypted"
          value={credential?.encrypted ? "YES" : "NO"}
        />
        <MetricRow
          label="credential type"
          value={credential?.credentialType ?? "unknown"}
        />
        <MetricRow
          label="secure store"
          value={status.secureStorageAvailable ? "available" : "unavailable"}
        />
        <MetricRow
          label="real gate"
          value={status.realAcceptanceCapabilityEnabled ? "ON" : "OFF"}
        />
        <MetricRow
          label="fake gate"
          value={status.fakeAcceptanceCapabilityEnabled ? "ON" : "OFF"}
        />
        <MetricRow label="release channel" value={status.releaseChannel} />
        <MetricRow
          label="profile enabled"
          value={profile?.enabledByReleaseGate ? "YES" : "NO"}
        />
        <MetricRow
          label="product routing"
          value={status.productRoutingEnabled ? "ON" : "OFF"}
        />
        <MetricRow
          label="consumed"
          value={status.ledger.consumed ? "YES" : "NO"}
        />
        <MetricRow
          label="request count"
          value={String(status.ledger.requestCount)}
        />
        <MetricRow
          label="real network"
          value="NO"
        />
      </dl>

      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          aria-label="DeepSeek platform API key"
          className="h-8 min-w-0 rounded-md border bg-background px-2 text-xs"
          disabled={sending}
          onChange={(event) => setDraftKey(event.currentTarget.value)}
          placeholder={configured ? "Credential configured" : "Paste fake key"}
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
          This is a DeepSeek official platform API key (
          {CLOUD_PROVIDER_ACCEPTANCE_CREDENTIAL_TYPE}) and will be encrypted
          locally. It is not a web or app membership credential, and the account
          has API balance for a small fixed diagnostic.
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
          disabled={sending || !canRunFake}
          onClick={confirmFakeRun}
          type="button"
          variant="default"
        >
          Run fake diagnostic
        </Button>
        <Button
          className="h-8 rounded-md px-2.5 text-xs"
          disabled={sending || !canRunReal}
          onClick={confirmRealRun}
          type="button"
          variant="default"
        >
          Run one-time real diagnostic
        </Button>
      </div>

      {preflightResult ? (
        <dl className="mb-3 divide-y divide-border border-y text-[11px]">
          <MetricRow
            label="acceptance id"
            value={preflightResult.acceptanceId}
          />
          <MetricRow
            label="allow fake"
            value={preflightResult.allowFakeAcceptance ? "YES" : "NO"}
          />
          <MetricRow
            label="allow real"
            value={preflightResult.allowSingleRealAcceptance ? "YES" : "NO"}
          />
          <MetricRow
            label="real gate"
            value={preflightResult.realAcceptanceCapability ? "ON" : "OFF"}
          />
          <MetricRow
            label="endpoint"
            value={`${preflightResult.endpointOrigin}${preflightResult.operationPath}`}
          />
          <MetricRow label="method" value={preflightResult.httpMethod} />
          <MetricRow
            label="redirect"
            value={preflightResult.redirectPolicy}
          />
          <MetricRow
            label="endpoint match"
            value={preflightResult.fullEndpointMatch ? "YES" : "NO"}
          />
          <MetricRow
            label="fixed input"
            value={preflightResult.fixedInput ? "YES" : "NO"}
          />
          <MetricRow
            label="stream"
            value={preflightResult.stream ? "YES" : "NO"}
          />
          <MetricRow
            label="include usage"
            value={
              preflightResult.streamUsageIncluded && preflightResult.includeUsage
                ? "YES"
                : "NO"
            }
          />
          <MetricRow
            label="thinking"
            value={preflightResult.thinkingType}
          />
          <MetricRow
            label="reasoning effort"
            value={preflightResult.reasoningEffort}
          />
          <MetricRow
            label="max tokens"
            value={String(preflightResult.maxTokens)}
          />
          <MetricRow
            label="timeouts"
            value={`${preflightResult.timeoutHeadersMs}/${preflightResult.timeoutFirstEventMs}/${preflightResult.timeoutIdleMs}/${preflightResult.timeoutOverallMs} ms`}
          />
          <MetricRow
            label="tools/retry/fallback"
            value={
              !preflightResult.toolsEnabled &&
              !preflightResult.retryEnabled &&
              !preflightResult.fallbackEnabled
                ? "OFF"
                : "ON"
            }
          />
          <MetricRow
            label="real network"
            value={preflightResult.realNetworkRequestSent ? "YES" : "NO"}
          />
          <MetricRow
            label="key type confirmed"
            value={preflightResult.providerKeyTypeConfirmed ? "YES" : "NO"}
          />
          <MetricRow
            label="api balance confirmed"
            value={preflightResult.apiBalanceConfirmedByUser ? "YES" : "NO"}
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
            label="real network"
            value={report.realNetworkRequestSent ? "YES" : "NO"}
          />
          <MetricRow
            label="response completed"
            value={report.responseCompleted ? "YES" : "NO"}
          />
          <MetricRow
            label="headers received"
            value={report.headersReceived ? "YES" : "NO"}
          />
          <MetricRow
            label="first event"
            value={report.firstEventReceived ? "YES" : "NO"}
          />
          <MetricRow
            label="stream completed"
            value={report.streamCompleted ? "YES" : "NO"}
          />
          <MetricRow
            label="done observed"
            value={report.doneObserved ? "YES" : "NO"}
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
          <MetricRow
            label="sanitized category"
            value={report.sanitizedResultCategory}
          />
          <MetricRow
            label="raw SSE persisted"
            value={report.rawSsePersisted ? "YES" : "NO"}
          />
          <MetricRow
            label="reasoning observed"
            value={report.reasoningObserved ? "YES" : "NO"}
          />
        </dl>
      ) : null}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Binding: {CLOUD_PROVIDER_ACCEPTANCE_DEEPSEEK_BINDING_ID}
      </p>
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
