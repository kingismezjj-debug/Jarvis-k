import type { UserControlledMemoryKind, UserControlledMemoryRecord } from "@jarvis-k/contracts";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  id: ActiveView;
  icon: LucideIcon;
};

export type ActiveView =
  | "conversation"
  | "tasks"
  | "plugins"
  | "memory"
  | "voice"
  | "activity"
  | "developer"
  | "settings";
export type UiLanguage = "en" | "zh";
export type SkinThemeId = "signal" | "harbor" | "ember";
export type UserControlledMemoryFilter = "all" | UserControlledMemoryKind;
export type UserControlledMemoryRiskFilter =
  | "all"
  | UserControlledMemoryRecord["risk"];
export type UserControlledMemorySort = "updated_desc" | "updated_asc" | "kind";
export type UserControlledMemoryViewPreferences = {
  filter: UserControlledMemoryFilter;
  riskFilter: UserControlledMemoryRiskFilter;
  sort: UserControlledMemorySort;
};
export type SanitizedUserControlledMemorySnapshotRecord = Pick<
  UserControlledMemoryRecord,
  | "id"
  | "kind"
  | "label"
  | "summary"
  | "preferenceKey"
  | "preferenceValue"
  | "source"
  | "risk"
  | "deletable"
  | "rawContentExposed"
  | "createdAt"
  | "updatedAt"
>;
export type SanitizedUserControlledMemorySnapshot = {
  schemaVersion: 1;
  generatedAt: string;
  provenance: "USER_INITIATED_MEMORY_VIEW";
  redactionPolicy: "SANITIZED_VISIBLE_FIELDS_ONLY";
  sourceBoundary: "USER_CONFIRMED_ONLY";
  importPolicy: "NOT_ENABLED";
  restorePolicy: "NOT_ENABLED";
  recordCount: number;
  records: SanitizedUserControlledMemorySnapshotRecord[];
};

export type ActionStatus = {
  label: string;
  tone: "success" | "warning" | "accent";
};

export type LocalTtsStatus =
  "disabled" | "eligible" | "playing" | "played" | "cancelled" | "unavailable";
