import { describe, expect, test } from "bun:test";
import { parseAboutPageRow } from "./about";

describe("about page data parsing", () => {
  test("returns valid default structure when input is null or undefined", () => {
    const data = parseAboutPageRow(null);
    expect(data.eyebrow).toBe("CONOCE AFROUP");
    expect(data.title).toContain("plataforma");
    expect(Array.isArray(data.values)).toBe(true);
    expect(data.values.length).toBeGreaterThan(0);
    expect(Array.isArray(data.stats)).toBe(true);
    expect(data.stats.length).toBe(3);
    expect(Array.isArray(data.team)).toBe(true);
    expect(data.team.length).toBe(4);
    expect(data.team[0].name).toBe("Jenniffer M.");
  });

  test("correctly parses custom JSON arrays for values, stats, and team", () => {
    const data = parseAboutPageRow({
      locale: "en",
      eyebrow: "ABOUT US",
      title: "Our Afro Heritage",
      lead: "Custom lead text",
      story_title: "Story Title",
      story_body: "Story Body",
      values_json: JSON.stringify(["Value 1", "Value 2"]),
      mission_title: "Mission",
      mission_body: "Mission Body",
      vision_title: "Vision",
      vision_body: "Vision Body",
      stats_json: JSON.stringify([{ value: "+500", label: "Members" }]),
      team_json: JSON.stringify([{ name: "Alice", role: "Developer", avatar_url: "/avatar.jpg" }]),
      cta_title: "Support Us",
      cta_body: "Donate now",
      collaborate_label: "Collaborate",
      donate_label: "Donate",
      og_json: JSON.stringify({ title: "Custom OG Title" }),
    });

    expect(data.eyebrow).toBe("ABOUT US");
    expect(data.values).toEqual(["Value 1", "Value 2"]);
    expect(data.stats).toEqual([{ value: "+500", label: "Members" }]);
    expect(data.team).toEqual([{ name: "Alice", role: "Developer", avatar_url: "/avatar.jpg" }]);
    expect(data.og.title).toBe("Custom OG Title");
  });

  test("handles malformed JSON gracefully with fallbacks", () => {
    const data = parseAboutPageRow({
      values_json: "{not valid json}",
      stats_json: "[invalid json",
      team_json: "null_bad",
    });

    expect(data.values.length).toBeGreaterThan(0);
    expect(data.stats.length).toBe(3);
    expect(data.team.length).toBe(4);
  });
});
