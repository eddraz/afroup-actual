import { describe, expect, test } from "bun:test";
import worker from "../src/index.js";

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
          first: async () => null,
          run: async () => ({ meta: { last_row_id: 1 } }),
        };
        return stmt;
      },
    },
  };
  return { env, calls };
}

function request(path) {
  return new Request(`https://afroup.test${path}`);
}

describe("Search and location query independence", () => {
  test("searching with q searches globally without department filter", async () => {
    const { env, calls } = createEnv();
    const response = await worker.fetch(request("/api/entries?q=alimentos"), env);

    expect(response.status).toBe(200);
    const listing = calls.find((c) => c.sql.includes("FROM aid_entries"));
    expect(listing).toBeDefined();
    expect(listing.sql).toContain("LIKE ?");
    expect(listing.sql).not.toContain("d.slug = ?");
  });

  test("filtering by department filters by slug without text search", async () => {
    const { env, calls } = createEnv();
    const response = await worker.fetch(request("/api/entries?department=choco"), env);

    expect(response.status).toBe(200);
    const listing = calls.find((c) => c.sql.includes("FROM aid_entries"));
    expect(listing).toBeDefined();
    expect(listing.sql).toContain("d.slug = ?");
    expect(listing.sql).not.toContain("LIKE ?");
    expect(listing.bound).toEqual(["choco"]);
  });

  test("when q is provided alongside department, q takes precedence for global search", async () => {
    const { env, calls } = createEnv();
    const response = await worker.fetch(request("/api/entries?department=choco&q=alimentos"), env);

    expect(response.status).toBe(200);
    const listing = calls.find((c) => c.sql.includes("FROM aid_entries"));
    expect(listing).toBeDefined();
    expect(listing.sql).toContain("LIKE ?");
    expect(listing.sql).not.toContain("d.slug = ?");
  });
});
