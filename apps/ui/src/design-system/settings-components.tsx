import * as React from "react";

import {
  Button,
  Section,
  SettingStatus,
  Switch,
  type ButtonVariant,
} from "./foundation-components";
import type { JarvisStatusKey, JarvisStatusLocale } from "./status-copy";

type SettingIdentity = {
  settingId?: string;
  capabilityId?: string;
};

export function SettingsPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="jk-settings-page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Section description={description} title={title}>
      {children}
    </Section>
  );
}

export function SettingRow({
  title,
  description,
  value,
  children,
  developerIdentity,
  showDeveloperIdentity = false,
}: {
  title: string;
  description: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  developerIdentity?: SettingIdentity;
  showDeveloperIdentity?: boolean;
}) {
  return (
    <div className="jk-setting-row">
      <div className="jk-stack">
        <span className="jk-setting-title">{title}</span>
        <span className="jk-setting-description">{description}</span>
        {showDeveloperIdentity && developerIdentity ? (
          <span className="jk-mono jk-muted">
            {[developerIdentity.settingId, developerIdentity.capabilityId]
              .filter(Boolean)
              .join(" / ")}
          </span>
        ) : null}
      </div>
      <div className="jk-setting-control">{children ?? value}</div>
    </div>
  );
}

export function SettingValueAction({
  value,
  actionLabel,
  onAction,
}: {
  value: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <button className="jk-value-action" onClick={onAction} type="button">
      <span>{value}</span>
      <span aria-hidden="true">&gt;</span>
      <span className="jk-sr-only">{actionLabel}</span>
    </button>
  );
}

export function SettingSwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SettingRow description={description} title={title}>
      <Switch
        checked={checked}
        disabled={disabled}
        label={title}
        onCheckedChange={onCheckedChange}
      />
    </SettingRow>
  );
}

export function SettingUnavailable({
  title,
  description,
  reason,
}: {
  title: string;
  description: string;
  reason: string;
}) {
  return (
    <SettingRow
      description={description}
      title={title}
      value={<span className="jk-muted">{reason}</span>}
    />
  );
}

export function SettingsCategoryNav({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Array<{ id: string; label: string }>;
  selectedId: string;
  onSelect?: (categoryId: string) => void;
}) {
  return (
    <nav aria-label="Settings categories" className="jk-category-nav">
      {categories.map((category) => (
        <button
          aria-current={category.id === selectedId ? "page" : undefined}
          className="jk-category-button"
          key={category.id}
          onClick={() => onSelect?.(category.id)}
          type="button"
        >
          {category.label}
        </button>
      ))}
    </nav>
  );
}

export function SettingsCategorySelect({
  categories,
  selectedId,
  label,
  onSelect,
}: {
  categories: Array<{ id: string; label: string }>;
  selectedId: string;
  label: string;
  onSelect?: (categoryId: string) => void;
}) {
  return (
    <label className="jk-stack">
      <span className="jk-setting-title">{label}</span>
      <select
        className="jk-select"
        onChange={(event) => onSelect?.(event.currentTarget.value)}
        value={selectedId}
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsSearchResult({
  breadcrumb,
  title,
  description,
  value,
}: {
  breadcrumb: string;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <article className="jk-search-result">
      <span className="jk-muted">{breadcrumb}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <strong>{value}</strong>
    </article>
  );
}

export function SettingsSearchEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="jk-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  );
}

export function ConnectionCard({
  title,
  description,
  statusKey,
  actionLabel,
  onAction,
  locale = "en",
}: {
  title: string;
  description: string;
  statusKey: JarvisStatusKey;
  actionLabel: string;
  onAction?: () => void;
  locale?: JarvisStatusLocale;
}) {
  return (
    <article className="jk-connection-card">
      <div className="jk-stack">
        <h3>{title}</h3>
        <p>{description}</p>
        <SettingStatus locale={locale} statusKey={statusKey} />
      </div>
      <Button onClick={onAction}>{actionLabel}</Button>
    </article>
  );
}

export function DangerSection({
  title,
  description,
  impact,
  actionLabel,
  onAction,
  actionDisabled = false,
}: {
  title: string;
  description: string;
  impact: string;
  actionLabel: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <section className="jk-section jk-danger-section">
      <header className="jk-section-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <SettingRow description={impact} title={actionLabel}>
        <Button
          disabled={actionDisabled}
          onClick={onAction}
          variant={"danger" satisfies ButtonVariant}
        >
          {actionLabel}
        </Button>
      </SettingRow>
    </section>
  );
}

export function DiagnosticList({
  rows,
  showInternalIds = false,
}: {
  rows: Array<{ label: string; value: string; internalId?: string }>;
  showInternalIds?: boolean;
}) {
  return (
    <dl className="jk-diagnostic-list">
      {rows.map((row) => (
        <div className="jk-diagnostic-row" key={row.label}>
          <dt>{row.label}</dt>
          <dd>
            {row.value}
            {showInternalIds && row.internalId ? (
              <span className="jk-mono"> {row.internalId}</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const settingsFoundationComponentNames = [
  "SettingsPageHeader",
  "SettingsSection",
  "SettingRow",
  "SettingValueAction",
  "SettingSwitchRow",
  "SettingStatus",
  "SettingUnavailable",
  "SettingsCategoryNav",
  "SettingsCategorySelect",
  "SettingsSearchResult",
  "SettingsSearchEmpty",
  "ConnectionCard",
  "DangerSection",
  "DiagnosticList",
] as const;
