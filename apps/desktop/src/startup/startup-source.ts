export const LOGIN_STARTUP_ARGUMENT = "--jarvis-startup=login";

export type DesktopStartupSource =
  | "manual"
  | "second_instance"
  | "login"
  | "installer"
  | "development";

export function resolveDesktopStartupSource(
  argv: readonly string[] = process.argv,
): DesktopStartupSource {
  if (argv.includes(LOGIN_STARTUP_ARGUMENT)) {
    return "login";
  }
  if (argv.includes("--squirrel-firstrun")) {
    return "installer";
  }
  return "manual";
}
