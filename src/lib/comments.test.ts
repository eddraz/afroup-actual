import { describe, expect, it } from "bun:test";
import { COMMENT_STATUSES, formatCommentAge, normalizeCommentBody } from "./comments";

describe("comments library helpers", () => {
  it("COMMENT_STATUSES exposes the four moderation statuses with localized labels", () => {
    expect(COMMENT_STATUSES.map((s) => s.value)).toEqual(["pending", "approved", "reported", "rejected"]);

    const pending = COMMENT_STATUSES.find((s) => s.value === "pending");
    expect(pending?.es).toBe("Pendiente");
    expect(pending?.en).toBe("Pending");

    const approved = COMMENT_STATUSES.find((s) => s.value === "approved");
    expect(approved?.es).toBe("Aprobado");
    expect(approved?.en).toBe("Approved");

    const reported = COMMENT_STATUSES.find((s) => s.value === "reported");
    expect(reported?.es).toBe("Reportado");
    expect(reported?.en).toBe("Reported");

    const rejected = COMMENT_STATUSES.find((s) => s.value === "rejected");
    expect(rejected?.es).toBe("Descartado");
    expect(rejected?.en).toBe("Rejected");
  });

  it("formatCommentAge renders compact minutes in Spanish and English", () => {
    const now = new Date("2025-05-10T12:00:00Z");

    expect(formatCommentAge("2025-05-10T11:56:00Z", "es", now)).toBe("hace 4 min");
    expect(formatCommentAge("2025-05-10T11:38:00Z", "es", now)).toBe("hace 22 min");
    expect(formatCommentAge("2025-05-10T11:56:00Z", "en", now)).toBe("4 min ago");
    expect(formatCommentAge("2025-05-10T11:38:00Z", "en", now)).toBe("22 min ago");
  });

  it("formatCommentAge renders compact hours and days in Spanish and English", () => {
    const now = new Date("2025-05-10T12:00:00Z");

    expect(formatCommentAge("2025-05-10T11:00:00Z", "es", now)).toBe("hace 1 h");
    expect(formatCommentAge("2025-05-10T10:00:00Z", "en", now)).toBe("2 h ago");
    expect(formatCommentAge("2025-05-08T12:00:00Z", "es", now)).toBe("hace 2 d");
    expect(formatCommentAge("2025-04-20T12:00:00Z", "en", now)).toBe("20 d ago");
  });

  it("formatCommentAge falls back to an instant label below one minute and for future timestamps", () => {
    const now = new Date("2025-05-10T12:00:00Z");

    expect(formatCommentAge("2025-05-10T11:59:30Z", "es", now)).toBe("hace un instante");
    expect(formatCommentAge("2025-05-10T11:59:30Z", "en", now)).toBe("just now");
    expect(formatCommentAge("2025-05-10T12:30:00Z", "es", now)).toBe("hace un instante");
    expect(formatCommentAge("2025-05-10T12:30:00Z", "en", now)).toBe("just now");
  });

  it("formatCommentAge returns an empty string for invalid dates", () => {
    const now = new Date("2025-05-10T12:00:00Z");

    expect(formatCommentAge("not a date", "es", now)).toBe("");
    expect(formatCommentAge("", "en", now)).toBe("");
  });

  it("normalizeCommentBody guards empty bodies and trims whitespace", () => {
    expect(normalizeCommentBody(null)).toBe("");
    expect(normalizeCommentBody(undefined)).toBe("");
    expect(normalizeCommentBody("   ")).toBe("");
    expect(normalizeCommentBody("  Excelente entrevista.  ")).toBe("Excelente entrevista.");
    expect(normalizeCommentBody(42)).toBe("42");
  });
});
