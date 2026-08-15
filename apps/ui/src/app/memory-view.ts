import type { UserControlledMemoryRecord } from "@jarvis-k/contracts";
import type {
  SanitizedUserControlledMemorySnapshot,
  UserControlledMemoryFilter,
  UserControlledMemoryRiskFilter,
  UserControlledMemorySort,
  UserControlledMemoryViewPreferences,
} from "./types";

export function formatUserControlledMemoryKey(
  memory: Pick<UserControlledMemoryRecord, "kind" | "sourceId">,
) {
  return `${memory.kind}:${memory.sourceId}`;
}

export const userControlledMemoryFilterOptions: Array<{
  id: UserControlledMemoryFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "route_alias", label: "Routes" },
  { id: "voice_command_alias", label: "Voice" },
  { id: "preference", label: "Prefs" },
];

export const userControlledMemoryRiskFilterOptions: Array<{
  id: UserControlledMemoryRiskFilter;
  label: string;
}> = [
  { id: "all", label: "All risk" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export const userControlledMemorySortOptions: Array<{
  id: UserControlledMemorySort;
  label: string;
}> = [
  { id: "updated_desc", label: "Newest" },
  { id: "updated_asc", label: "Oldest" },
  { id: "kind", label: "Kind" },
];

export const USER_CONTROLLED_MEMORY_VIEW_STORAGE_KEY =
  "jarvis-k-user-controlled-memory-view-v1";
export const USER_CONTROLLED_MEMORY_SNAPSHOT_SCHEMA_VERSION = 1;
export const defaultUserControlledMemoryViewPreferences: UserControlledMemoryViewPreferences =
  {
    filter: "all",
    riskFilter: "all",
    sort: "updated_desc",
  };

export function isUserControlledMemoryFilter(
  value: unknown,
): value is UserControlledMemoryFilter {
  return userControlledMemoryFilterOptions.some(
    (option) => option.id === value,
  );
}

export function isUserControlledMemoryRiskFilter(
  value: unknown,
): value is UserControlledMemoryRiskFilter {
  return userControlledMemoryRiskFilterOptions.some(
    (option) => option.id === value,
  );
}

export function isUserControlledMemorySort(
  value: unknown,
): value is UserControlledMemorySort {
  return userControlledMemorySortOptions.some((option) => option.id === value);
}

export function readInitialUserControlledMemoryViewPreferences(): UserControlledMemoryViewPreferences {
  if (typeof window === "undefined") {
    return defaultUserControlledMemoryViewPreferences;
  }
  try {
    const storedView = window.localStorage.getItem(
      USER_CONTROLLED_MEMORY_VIEW_STORAGE_KEY,
    );
    if (!storedView) {
      return defaultUserControlledMemoryViewPreferences;
    }
    const parsedView = JSON.parse(storedView) as Partial<
      Record<keyof UserControlledMemoryViewPreferences, unknown>
    >;
    return {
      filter: isUserControlledMemoryFilter(parsedView.filter)
        ? parsedView.filter
        : defaultUserControlledMemoryViewPreferences.filter,
      riskFilter: isUserControlledMemoryRiskFilter(parsedView.riskFilter)
        ? parsedView.riskFilter
        : defaultUserControlledMemoryViewPreferences.riskFilter,
      sort: isUserControlledMemorySort(parsedView.sort)
        ? parsedView.sort
        : defaultUserControlledMemoryViewPreferences.sort,
    };
  } catch {
    window.localStorage.removeItem(USER_CONTROLLED_MEMORY_VIEW_STORAGE_KEY);
    return defaultUserControlledMemoryViewPreferences;
  }
}

export function persistUserControlledMemoryViewPreferences(
  preferences: UserControlledMemoryViewPreferences,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    USER_CONTROLLED_MEMORY_VIEW_STORAGE_KEY,
    JSON.stringify(preferences),
  );
}

export function buildSanitizedUserControlledMemorySnapshot(
  memories: UserControlledMemoryRecord[],
): SanitizedUserControlledMemorySnapshot {
  const records = memories.map((memory) => ({
    id: memory.id,
    kind: memory.kind,
    label: memory.label,
    summary: memory.summary,
    preferenceKey: memory.preferenceKey,
    preferenceValue: memory.preferenceValue,
    source: memory.source,
    risk: memory.risk,
    deletable: memory.deletable,
    rawContentExposed: false as const,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  }));
  return {
    schemaVersion: USER_CONTROLLED_MEMORY_SNAPSHOT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    provenance: "USER_INITIATED_MEMORY_VIEW",
    redactionPolicy: "SANITIZED_VISIBLE_FIELDS_ONLY",
    sourceBoundary: "USER_CONFIRMED_ONLY",
    importPolicy: "NOT_ENABLED",
    restorePolicy: "NOT_ENABLED",
    recordCount: records.length,
    records,
  };
}

export function validateSanitizedUserControlledMemorySnapshot(
  snapshot: SanitizedUserControlledMemorySnapshot,
) {
  return (
    snapshot.schemaVersion === USER_CONTROLLED_MEMORY_SNAPSHOT_SCHEMA_VERSION &&
    snapshot.provenance === "USER_INITIATED_MEMORY_VIEW" &&
    snapshot.redactionPolicy === "SANITIZED_VISIBLE_FIELDS_ONLY" &&
    snapshot.sourceBoundary === "USER_CONFIRMED_ONLY" &&
    snapshot.importPolicy === "NOT_ENABLED" &&
    snapshot.restorePolicy === "NOT_ENABLED" &&
    snapshot.recordCount === snapshot.records.length &&
    snapshot.records.every((record) => record.rawContentExposed === false)
  );
}
