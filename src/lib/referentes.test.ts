import { describe, expect, it } from "bun:test";
import {
  slugifyReferente,
  parseMilestones,
  serializeMilestones,
  type ReferenteMilestone,
} from "./referentes";

describe("referentes library helpers", () => {
  it("slugifyReferente generates clean URL slugs", () => {
    expect(slugifyReferente("Martin Luther King Jr.")).toBe("martin-luther-king-jr");
    expect(slugifyReferente("Reina Nzinga Mbande")).toBe("reina-nzinga-mbande");
    expect(slugifyReferente("Lélia Gonzalez")).toBe("lelia-gonzalez");
    expect(slugifyReferente("Benkos Biohó")).toBe("benkos-bioho");
    expect(slugifyReferente("Francia Márquez")).toBe("francia-marquez");
    expect(slugifyReferente("")).toBe("referente");
  });

  it("parseMilestones safely parses valid JSON and ignores malformed inputs", () => {
    expect(parseMilestones(null)).toEqual([]);
    expect(parseMilestones("")).toEqual([]);
    expect(parseMilestones("invalid json")).toEqual([]);
    expect(parseMilestones("{\"key\":\"value\"}")).toEqual([]);

    const json = JSON.stringify([
      { year: "1955", event: "Montgomery bus boycott" },
      { year: "1963", event: "March on Washington" },
      { year: "", event: "" },
    ]);
    const parsed = parseMilestones(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ year: "1955", event: "Montgomery bus boycott" });
    expect(parsed[1]).toEqual({ year: "1963", event: "March on Washington" });
  });

  it("serializeMilestones cleans and formats array to JSON string", () => {
    const raw: ReferenteMilestone[] = [
      { year: " 1964 ", event: " Nobel Peace Prize " },
      { year: " ", event: " " },
    ];
    const serialized = serializeMilestones(raw);
    expect(serialized).toBe(JSON.stringify([{ year: "1964", event: "Nobel Peace Prize" }]));
  });
});
