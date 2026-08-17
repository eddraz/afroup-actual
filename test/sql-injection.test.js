import { describe, expect, test } from "bun:test";
import worker from "../src/index.js";

const PAYLOADS = [
  "' OR 1=1 --",
  "\"; DROP TABLE aid_entries; --",
  "' UNION SELECT password_hash FROM admin_credentials --",
  "1; DELETE FROM admin_sessions; --",
];

function createEnv() {
  const calls = [];
  const env = {
    ADMIN_USER: "admin",
    DB: {
      prepare(sql) {
        const call = { sql, bound: undefined };
        calls.push(call);
        const stmt = {
          bind(...args) {
            call.bound = args;
            return stmt;
          },
          all: async () => ({ results: [] }),
          first: async () => {
            if (sql.includes("FROM admin_sessions")) {
              return {
                id: "test-session",
                expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              };
            }
            return null;
          },
          run: async () => ({ meta: { last_row_id: 1 } }),
        };
        return stmt;
      },
    },
  };
  return { env, calls };
}

function request(path, headers = {}) {
  return new Request(`https://afroup.test${path}`, { headers });
}

function placeholderCount(sql) {
  return (sql.match(/\?/g) || []).length;
}

function searchCall(calls) {
  return calls.find((call) => call.sql.includes("LIKE ?"));
}

function assertParameterized(call, payload) {
  expect(call).toBeDefined();
  expect(call.sql).not.toContain(payload);
  expect(call.bound).toBeDefined();
  expect(call.bound.length).toBe(placeholderCount(call.sql));
  expect(call.bound.filter((value) => value === `%${payload}%`).length).toBeGreaterThan(0);
  expect(call.bound).not.toContain(payload);
}

describe("SQL injection", () => {
  test("public search never interpolates q into SQL", async () => {
    for (const payload of PAYLOADS) {
      const { env, calls } = createEnv();
      const query = new URLSearchParams({ q: payload }).toString();
      const response = await worker.fetch(request(`/api/entries?${query}`), env);

      expect(response.status).toBe(200);
      expect(calls.every((call) => !call.sql.includes(payload))).toBe(true);
    }
  });

  test("public department filter binds the slug", async () => {
    const payload = "choco' OR '1'='1";
    const { env, calls } = createEnv();
    const query = new URLSearchParams({ department: payload }).toString();
    const response = await worker.fetch(request(`/api/entries?${query}`), env);
    const listing = calls.find((call) => call.sql.includes("FROM aid_entries"));

    expect(response.status).toBe(200);
    expect(listing.sql).not.toContain(payload);
    expect(listing.bound).toEqual([payload]);
    expect(listing.sql).toContain("d.slug = ?");
  });

  test("admin search never interpolates q into SQL", async () => {
    for (const payload of PAYLOADS) {
      const { env, calls } = createEnv();
      const query = new URLSearchParams({ q: payload }).toString();
      const response = await worker.fetch(
        request(`/api/admin/entries?${query}`, { cookie: "afroup_admin=test-session" }),
        env
      );

      expect(response.status).toBe(200);
      expect(calls.every((call) => !call.sql.includes(payload))).toBe(true);
    }
  });

  test("admin status is allowlisted and never reaches SQL", async () => {
    const payload = "published' OR 1=1 --";
    const { env, calls } = createEnv();
    const query = new URLSearchParams({ status: payload }).toString();
    const response = await worker.fetch(
      request(`/api/admin/entries?${query}`, { cookie: "afroup_admin=test-session" }),
      env
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Estado no válido.");
    expect(calls.some((call) => call.sql.includes("FROM aid_entries"))).toBe(false);
    expect(calls.every((call) => !call.sql.includes(payload))).toBe(true);
  });
});
