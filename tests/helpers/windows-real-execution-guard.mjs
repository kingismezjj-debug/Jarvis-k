export const REAL_WINDOWS_EXECUTION_ENV = "JARVIS_K_ALLOW_REAL_WINDOWS_EXECUTION";
export const REAL_WINDOWS_EXECUTION_DISABLED_CODE =
  "REAL_WINDOWS_EXECUTION_NOT_ENABLED";
export const DEFAULT_REAL_WINDOWS_ITERATIONS = 1;

export function parseIterations(argv, options = {}) {
  const requireExplicitIterations =
    options.requireExplicitIterations === true;
  let explicitValue;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--iterations") {
      explicitValue = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--iterations=")) {
      explicitValue = arg.slice("--iterations=".length);
    }
  }

  if (explicitValue === undefined) {
    if (requireExplicitIterations) {
      throw new Error("REAL_WINDOWS_ITERATIONS_REQUIRED");
    }
    return DEFAULT_REAL_WINDOWS_ITERATIONS;
  }

  const parsed = Number.parseInt(explicitValue, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error("REAL_WINDOWS_ITERATIONS_INVALID");
  }
  return parsed;
}

export function requireRealWindowsExecution(options) {
  const argv = options.argv ?? process.argv.slice(2);
  const plannedActions = options.plannedActions ?? [];
  if (process.env[REAL_WINDOWS_EXECUTION_ENV] !== "1") {
    console.error(REAL_WINDOWS_EXECUTION_DISABLED_CODE);
    console.error(
      `${options.scriptName} can operate real Windows apps only when ${REAL_WINDOWS_EXECUTION_ENV}=1 is set.`,
    );
    process.exit(1);
  }

  let iterations;
  try {
    iterations = parseIterations(argv, {
      requireExplicitIterations: options.requireExplicitIterations === true,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  const dryRun = argv.includes("--dry-run");
  const software = [
    ...new Set(plannedActions.flatMap((action) => action.software ?? [])),
  ];
  const estimatedActions = plannedActions.reduce(
    (sum, action) => sum + (action.count ?? 1),
    0,
  ) * iterations;

  console.log(
    JSON.stringify({
      realWindowsExecution: "enabled",
      scriptName: options.scriptName,
      dryRun,
      iterations,
      estimatedActions,
      software,
      fixtureOrFakeExecutorCountsAsRealExecution: false,
      userExistingWindowsMustNotBeClosed: true,
    }),
  );

  return {
    dryRun,
    iterations,
    estimatedActions,
    software,
  };
}
