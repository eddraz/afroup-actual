import { describe, expect, test } from "bun:test";
import { parseContactPageRow, validateContactSubmissionInput } from "./contact";

describe("contact page data parsing", () => {
  test("returns valid default structure when input is null or undefined", () => {
    const data = parseContactPageRow(null);
    expect(data.eyebrow).toBe("Contáctanos");
    expect(data.title).toBe("Hablemos");
    expect(data.email).toBe("hello@afroup.org");
    expect(data.whatsapp).toContain("+57");
    expect(data.base_location).toContain("Colombia");
  });

  test("correctly parses custom row values", () => {
    const data = parseContactPageRow({
      locale: "en",
      eyebrow: "Contact us",
      title: "Let's talk",
      lead: "Custom lead",
      email: "press@afroup.org",
      whatsapp: "+1 555 1234",
      base_location: "London, UK",
      social_channels: "@afroup_global",
      response_time: "Within 24h",
      og_json: JSON.stringify({ title: "Custom Contact OG" }),
    });

    expect(data.eyebrow).toBe("Contact us");
    expect(data.title).toBe("Let's talk");
    expect(data.email).toBe("press@afroup.org");
    expect(data.whatsapp).toBe("+1 555 1234");
    expect(data.base_location).toBe("London, UK");
    expect(data.response_time).toBe("Within 24h");
    expect(data.og.title).toBe("Custom Contact OG");
  });
});

describe("contact submission input validation", () => {
  test("accepts valid submission", () => {
    const res = validateContactSubmissionInput({
      name: "Jenniffer Mosquera",
      email: "jenniffer@afroup.com",
      subject: "Alianzas",
      message: "Queremos trabajar juntos en un proyecto cultural.",
    });
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  test("rejects missing or short name", () => {
    const res = validateContactSubmissionInput({
      name: "A",
      email: "test@example.com",
      subject: "Test",
      message: "This is a test message.",
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("nombre");
  });

  test("rejects invalid email", () => {
    const res = validateContactSubmissionInput({
      name: "Jenniffer",
      email: "not-an-email",
      subject: "Test",
      message: "This is a test message.",
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("correo");
  });

  test("rejects short message", () => {
    const res = validateContactSubmissionInput({
      name: "Jenniffer",
      email: "test@example.com",
      subject: "Test",
      message: "Hi",
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("mensaje");
  });
});
