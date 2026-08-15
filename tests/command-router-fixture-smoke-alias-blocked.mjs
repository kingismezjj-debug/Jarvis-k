const [legacyScriptName = "legacy command-router fixture smoke", replacement] =
  process.argv.slice(2);

const replacementHint = replacement
  ? ` Use ${replacement} for the explicit test-only fixture harness.`
  : "";

console.error(
  `${legacyScriptName} is disabled because fixture router replay is no longer part of the production smoke path.${replacementHint}`
);
console.error(
  "COMMAND_ROUTER_FIXTURE_SMOKE_ALIAS_DISABLED"
);
process.exit(1);
