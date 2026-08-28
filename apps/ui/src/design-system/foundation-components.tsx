import * as React from "react";

import {
  getJarvisStatusLabel,
  jarvisStatusDictionary,
  type JarvisStatusKey,
  type JarvisStatusLocale,
  type JarvisStatusTone,
} from "./status-copy";

import "./foundation.css";

type Density = "comfortable" | "compact";

export type FoundationProps = {
  className?: string;
  density?: Density;
};

function joinClassNames(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  children,
  className,
  variant = "secondary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={joinClassNames("jk-button", className)}
      data-variant={variant}
      type={props.type ?? "button"}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className={joinClassNames("jk-icon-button", className)}
      type={props.type ?? "button"}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  description,
  id,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
}) {
  const inputId = id ?? React.useId();
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <label className="jk-stack" htmlFor={inputId}>
      <span className="jk-setting-title">{label}</span>
      {description ? (
        <span className="jk-setting-description" id={descriptionId}>
          {description}
        </span>
      ) : null}
      <input
        aria-describedby={descriptionId}
        className={joinClassNames("jk-text-field", className)}
        id={inputId}
        {...props}
      />
    </label>
  );
}

export function SearchField({
  label,
  id,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  const inputId = id ?? React.useId();

  return (
    <label className="jk-stack" htmlFor={inputId}>
      <span className="jk-setting-title">{label}</span>
      <input
        className={joinClassNames("jk-search-field", className)}
        id={inputId}
        type="search"
        {...props}
      />
    </label>
  );
}

export function Switch({
  label,
  checked,
  description,
  onCheckedChange,
  className,
  disabled,
}: {
  label: string;
  checked: boolean;
  description?: string;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}) {
  const descriptionId = description ? React.useId() : undefined;

  return (
    <div className="jk-row">
      <button
        aria-checked={checked}
        aria-describedby={descriptionId}
        aria-label={label}
        className={joinClassNames("jk-switch", className)}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        role="switch"
        type="button"
      >
        <span aria-hidden="true" className="jk-switch-thumb" />
      </button>
      <span className="jk-stack">
        <span className="jk-setting-title">{label}</span>
        {description ? (
          <span className="jk-setting-description" id={descriptionId}>
            {description}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function Select({
  label,
  id,
  options,
  description,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  description?: string;
  options: Array<{ value: string; label: string }>;
}) {
  const selectId = id ?? React.useId();
  const descriptionId = description ? `${selectId}-description` : undefined;

  return (
    <label className="jk-stack" htmlFor={selectId}>
      <span className="jk-setting-title">{label}</span>
      {description ? (
        <span className="jk-setting-description" id={descriptionId}>
          {description}
        </span>
      ) : null}
      <select
        aria-describedby={descriptionId}
        className={joinClassNames("jk-select", className)}
        id={selectId}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement<{ "aria-describedby"?: string }>;
}) {
  const tooltipId = React.useId();

  return (
    <span className="jk-tooltip">
      {React.cloneElement(children, { "aria-describedby": tooltipId })}
      <span className="jk-tooltip-content" id={tooltipId} role="tooltip">
        {label}
      </span>
    </span>
  );
}

export function Dialog({
  title,
  description,
  open,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = React.useId();
  const descriptionId = description ? React.useId() : undefined;

  if (!open) return null;

  return (
    <div className="jk-dialog-scrim" role="presentation">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="jk-dialog"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        role="dialog"
      >
        <div className="jk-row">
          <h2 className="jk-setting-title" id={titleId}>
            {title}
          </h2>
          <IconButton label="Close dialog" onClick={onClose}>
            x
          </IconButton>
        </div>
        {description ? (
          <p className="jk-setting-description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {children}
      </section>
    </div>
  );
}

export function Divider() {
  return <hr className="jk-divider" role="separator" />;
}

export function Badge({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: JarvisStatusTone;
}) {
  return (
    <span className="jk-badge" data-tone={tone}>
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span aria-label={label} className="jk-spinner" role="status">
      <span aria-hidden="true" />
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="jk-empty-state">
      <h3 className="jk-setting-title">{title}</h3>
      <p className="jk-setting-description">{description}</p>
      {action}
    </section>
  );
}

export function InlineNotice({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: React.ReactNode;
  tone?: JarvisStatusTone;
}) {
  return (
    <aside className="jk-inline-notice" data-tone={tone} role="note">
      <strong>{title}</strong>
      <span>{children}</span>
    </aside>
  );
}

export function Section({
  title,
  description,
  children,
  density = "comfortable",
}: FoundationProps & {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="jk-section" data-density={density}>
      <header className="jk-section-header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function Stack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={joinClassNames("jk-stack", className)}>{children}</div>;
}

export function Row({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={joinClassNames("jk-row", className)}>{children}</div>;
}

export function SettingStatus({
  statusKey,
  locale = "en",
  developer = false,
}: {
  statusKey: JarvisStatusKey;
  locale?: JarvisStatusLocale;
  developer?: boolean;
}) {
  const presentation = jarvisStatusDictionary[statusKey];
  return (
    <span className="jk-status" data-tone={presentation.tone}>
      {getJarvisStatusLabel({
        key: statusKey,
        locale,
        surface: developer ? "developer" : "product",
      })}
    </span>
  );
}

export const foundationComponentNames = [
  "Button",
  "IconButton",
  "TextField",
  "SearchField",
  "Switch",
  "Select",
  "Tooltip",
  "Dialog",
  "Divider",
  "Badge",
  "Spinner",
  "EmptyState",
  "InlineNotice",
  "Section",
  "Stack",
  "Row",
  "SettingStatus",
] as const;
