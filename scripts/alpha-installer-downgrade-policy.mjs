export const ALPHA_INSTALLER_POLICY_SCHEMA_VERSION = 1;
export const ALPHA_INSTALLER_STATE_KEY =
  "HKCU\\Software\\Jarvis-K\\Alpha\\InstallerState";
export const ALPHA_RELEASE_ORDINAL = 6;
export const ALPHA_CURRENT_VERSION = "0.1.0-alpha.6";
export const ALPHA_SHORT_VERSION_WINDOWS = "0.1.0.6";
export const ALPHA_APP_ID = "com.jarvis-k.desktop.alpha";
export const ALPHA_CHANNEL = "alpha";
export const ALPHA_PRODUCT_NAME = "Jarvis-K Alpha";
export const ALPHA_DOWNGRADE_EXIT_CODE = 1638;
export const ALPHA_MARKER_FAILURE_EXIT_CODE = 1603;

export const PRE_MARKER_BOOTSTRAP_ALLOWLIST = Object.freeze([
  {
    displayName: "Jarvis-K Alpha 0.1.0-alpha.4",
    displayVersion: "0.1.0-alpha.4",
    releaseOrdinal: 4,
  },
  {
    displayName: "Jarvis-K Alpha 0.1.0-alpha.5",
    displayVersion: "0.1.0-alpha.5",
    releaseOrdinal: 5,
  },
]);

export function createAlphaInstallerPolicyPlan() {
  return {
    schemaVersion: ALPHA_INSTALLER_POLICY_SCHEMA_VERSION,
    phase: "UI-3H-3C Downgrade Prevention Implementation",
    currentVersion: ALPHA_CURRENT_VERSION,
    shortVersionWindows: ALPHA_SHORT_VERSION_WINDOWS,
    productName: ALPHA_PRODUCT_NAME,
    appId: ALPHA_APP_ID,
    channel: ALPHA_CHANNEL,
    releaseOrdinal: ALPHA_RELEASE_ORDINAL,
    marker: {
      key: ALPHA_INSTALLER_STATE_KEY,
      values: {
        schemaVersion: ALPHA_INSTALLER_POLICY_SCHEMA_VERSION,
        installedReleaseOrdinal: ALPHA_RELEASE_ORDINAL,
        installedVersion: ALPHA_CURRENT_VERSION,
        appId: ALPHA_APP_ID,
        channel: ALPHA_CHANNEL,
      },
      retainedOnUninstall: true,
      containsUserData: false,
    },
    downgradePolicy: {
      comparison: "integer_release_ordinal",
      guiAndSilentCovered: true,
      silentFailureExitCode: ALPHA_DOWNGRADE_EXIT_CODE,
      rendererWritable: false,
      profileWritable: false,
      lexicographicSemverComparison: false,
      historicalUnsignedInstallersRetroactivelyControlled: false,
    },
    preMarkerBootstrapAllowlist: PRE_MARKER_BOOTSTRAP_ALLOWLIST,
    pendingAcceptance: [
      "clean-alpha6-install",
      "alpha5-to-alpha6-in-place-upgrade",
      "guarded-alpha6-to-lower-guarded-candidate-block",
      "same-version-alpha6-repair",
      "alpha6-uninstall-retains-marker",
    ],
  };
}

export function classifyAlphaInstallerPolicy(input = {}) {
  const marker = input.marker ?? null;
  if (marker) {
    const markerValidation = validateMarker(marker);
    if (!markerValidation.ok) {
      return blocked("malformed_marker", markerValidation.reason);
    }
    if (marker.installedReleaseOrdinal > ALPHA_RELEASE_ORDINAL) {
      return blocked("downgrade_blocked", "installed_ordinal_newer");
    }
    if (marker.installedReleaseOrdinal === ALPHA_RELEASE_ORDINAL) {
      return allowed("same_version_repair_allowed");
    }
    return allowed("upgrade_allowed");
  }

  const registration = input.uninstallRegistration ?? null;
  if (!registration?.present) {
    if (input.installedPackagePresent) {
      return blocked(
        "pre_marker_unknown_install_blocked",
        "installed_package_without_registration",
      );
    }
    return allowed("clean_install_allowed");
  }

  if (
    PRE_MARKER_BOOTSTRAP_ALLOWLIST.some(
      (allowedRegistration) =>
        allowedRegistration.displayName === registration.displayName &&
        allowedRegistration.displayVersion === registration.displayVersion,
    )
  ) {
    return allowed("pre_marker_bootstrap_upgrade_allowed");
  }

  return blocked("pre_marker_unknown_install_blocked", "unknown_bootstrap_install");
}

function validateMarker(marker) {
  if (marker.schemaVersion !== ALPHA_INSTALLER_POLICY_SCHEMA_VERSION) {
    return { ok: false, reason: "schema_version_invalid" };
  }
  if (
    !Number.isInteger(marker.installedReleaseOrdinal) ||
    marker.installedReleaseOrdinal < 0
  ) {
    return { ok: false, reason: "ordinal_invalid" };
  }
  if (!isAlphaVersion(marker.installedVersion)) {
    return { ok: false, reason: "installed_version_invalid" };
  }
  if (marker.appId !== ALPHA_APP_ID) {
    return { ok: false, reason: "app_id_mismatch" };
  }
  if (marker.channel !== ALPHA_CHANNEL) {
    return { ok: false, reason: "channel_mismatch" };
  }
  return { ok: true };
}

function allowed(classification) {
  return {
    ok: true,
    action: "allow",
    classification,
    currentReleaseOrdinal: ALPHA_RELEASE_ORDINAL,
  };
}

function blocked(classification, reason) {
  return {
    ok: false,
    action: "block",
    classification,
    reason,
    exitCode: ALPHA_DOWNGRADE_EXIT_CODE,
    currentReleaseOrdinal: ALPHA_RELEASE_ORDINAL,
  };
}

function isAlphaVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+-alpha\.\d+$/u.test(value);
}
