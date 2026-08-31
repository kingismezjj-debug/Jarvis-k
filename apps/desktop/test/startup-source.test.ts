import { describe, expect, it } from "vitest";
import {
  LEGACY_LOGIN_STARTUP_ARGUMENT,
  LOGIN_STARTUP_ARGUMENT,
  resolveDesktopStartupSource,
} from "../src/startup/startup-source";

describe("resolveDesktopStartupSource", () => {
  it("recognizes Windows login startup from an explicit argument", () => {
    expect(resolveDesktopStartupSource(["Jarvis-K.exe", LOGIN_STARTUP_ARGUMENT])).toBe(
      "login",
    );
  });

  it("recognizes the legacy Windows login startup argument during migration", () => {
    expect(
      resolveDesktopStartupSource([
        "Jarvis-K.exe",
        LEGACY_LOGIN_STARTUP_ARGUMENT,
      ]),
    ).toBe("login");
  });

  it("does not treat unrelated arguments as login startup", () => {
    expect(resolveDesktopStartupSource(["Jarvis-K.exe", "--startup"])).toBe(
      "manual",
    );
    expect(resolveDesktopStartupSource(["Jarvis-K.exe", "startup=login"])).toBe(
      "manual",
    );
  });

  it("recognizes installer first-run separately from manual launch", () => {
    expect(resolveDesktopStartupSource(["Jarvis-K.exe", "--squirrel-firstrun"])).toBe(
      "installer",
    );
    expect(resolveDesktopStartupSource(["Jarvis-K.exe"])).toBe("manual");
  });
});
