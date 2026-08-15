import {
  REAL_WINDOWS_EXECUTION_DISABLED_CODE,
  REAL_WINDOWS_EXECUTION_ENV,
} from "./helpers/windows-real-execution-guard.mjs";

const oldScript = process.argv[2] ?? "legacy smoke script";
const replacement = process.argv[3] ?? "acceptance:windows:real";

console.error(REAL_WINDOWS_EXECUTION_DISABLED_CODE);
console.error(
  `${oldScript} no longer runs real desktop actions. Use npm run ${replacement} with ${REAL_WINDOWS_EXECUTION_ENV}=1.`,
);
process.exit(1);
