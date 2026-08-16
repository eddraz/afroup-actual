import { describe, expect, test } from "bun:test";
import { visibleRecordIds } from "./record-scope";

describe("visibleRecordIds", () => {
  test("without shares a user only sees self and owned records", () => {
    expect(
      visibleRecordIds({
        actorId: 1,
        ownedIds: [1, 4],
        sharedIds: [],
      }),
    ).toEqual([1, 4]);
  });

  test("shared records appear in addition to owned ones", () => {
    expect(
      visibleRecordIds({
        actorId: 1,
        ownedIds: [1],
        sharedIds: [9, 12],
      }),
    ).toEqual([1, 9, 12]);
  });

  test("parent no longer opens the creator tree", () => {
    expect(
      visibleRecordIds({
        actorId: 2,
        ownedIds: [2],
        sharedIds: [],
        creatorId: 1,
      }),
    ).toEqual([2]);
  });
});
