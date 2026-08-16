import { describe, expect, test } from "bun:test";
import { LOGO_PATHS, LOGO_VIEWBOX, logoSize, type LogoVariant } from "./logo";

describe("logo geometry", () => {
  test("keeps the traced wordmark and AU mark viewBoxes", () => {
    expect(LOGO_VIEWBOX.wordmark).toEqual({ width: 1600, height: 288 });
    expect(LOGO_VIEWBOX.mark).toEqual({ width: 1368, height: 845 });
  });

  test("exposes one compound path per letter", () => {
    expect(LOGO_PATHS.wordmark).toHaveLength(6);
    expect(LOGO_PATHS.mark).toHaveLength(2);

    for (const variant of Object.keys(LOGO_PATHS) as LogoVariant[]) {
      for (const path of LOGO_PATHS[variant]) {
        expect(path.startsWith("M")).toBe(true);
        expect(path.endsWith("Z")).toBe(true);
      }
    }
    for (const path of LOGO_PATHS.mark) {
      expect(path.includes("A")).toBe(true);
    }
  });

  test("keeps the official logo-black.svg silhouettes", () => {
    expect(LOGO_PATHS.wordmark[0].startsWith("M86.8 1.1")).toBe(true);
    expect(LOGO_PATHS.wordmark[1].startsWith("M248 139")).toBe(true);
    expect(LOGO_PATHS.wordmark[5].startsWith("M1330 139.5")).toBe(true);
  });

  test("cuts counters out of R, O and P", () => {
    expect(LOGO_PATHS.wordmark.map((path) => (path.match(/M/g) ?? []).length)).toEqual([1, 1, 2, 2, 1, 2]);
  });
});

describe("logoSize", () => {
  test("scales the wordmark from height while keeping the source ratio", () => {
    expect(logoSize("wordmark", 30)).toEqual({
      width: 30 * (1600 / 288),
      height: 30,
      viewBox: "0 0 1600 288",
    });
  });

  test("scales the AU mark from height while keeping the source ratio", () => {
    expect(logoSize("mark", 48)).toEqual({
      width: 48 * (1368 / 845),
      height: 48,
      viewBox: "0 0 1368 845",
    });
  });

  test("rejects a non-positive height", () => {
    expect(() => logoSize("wordmark", 0)).toThrow("positive");
    expect(() => logoSize("mark", -12)).toThrow("positive");
  });
});
