import { describe, expect, it } from "vitest";
import {
  LOGIN_STARTUP_ARGUMENT,
  resolveDesktopStartupSource,
} from "../src/startup/startup-source";

describe("resolveDesktopStartupSource", () => {
  it("recognizes Windows login startup from an explicit argument", () => {
    expect(resolveDesktopStartupSource(["Jarvis-K.exe", LOGIN_STARTUP_ARGUMENT])).toBe(
      "login",
    );
  });

  it("recognizes installer first-run separately from manual launch", () => {
    expect(resolveDesktopStartupSource(["Jarvis-K.exe", "--squirrel-firstrun"])).toBe(
      "installer",
    );
    expect(resolveDesktopStartupSource(["Jarvis-K.exe"])).toBe("manual");
  });
});
