import { describe, expect, test } from "bun:test";
import worker from "../src/index.js";

function createEnv() {
  const store = new Map();
  const env = {
    ADMIN_USER: "admin",
    UPLOADS: {
      async put(key, body, options) {
        store.set(key, { body, options });
        return { key };
      },
      async get(key) {
        const item = store.get(key);
        if (!item) return null;
        return {
          body: item.body,
          httpMetadata: item.options?.httpMetadata || {},
          httpEtag: "test-etag",
          writeHttpMetadata(headers) {
            if (item.options?.httpMetadata?.contentType) {
              headers.set("content-type", item.options.httpMetadata.contentType);
            }
          },
        };
      },
    },
    DB: {
      prepare(sql) {
        const stmt = {
          bind(...args) {
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
  return { env, store };
}

describe("Image uploads and R2 storage", () => {
  test("successfully uploads an image and returns the /api/uploads/ URL", async () => {
    const { env, store } = createEnv();
    const formData = new FormData();
    const fakeImage = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });
    formData.append("file", fakeImage, "foto.png");

    const req = new Request("https://afroup.test/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.url).toMatch(/^\/api\/uploads\/[a-zA-Z0-9_-]+\.png$/);

    const key = data.url.replace("/api/uploads/", "");
    expect(store.has(key)).toBe(true);
  });

  test("serves uploaded image from R2 with caching headers", async () => {
    const { env } = createEnv();
    const formData = new FormData();
    const fakeImage = new Blob([new Uint8Array([255, 216, 255, 224])], { type: "image/jpeg" });
    formData.append("file", fakeImage, "banner.jpg");

    const uploadReq = new Request("https://afroup.test/api/upload", {
      method: "POST",
      body: formData,
    });
    const uploadRes = await worker.fetch(uploadReq, env);
    const uploadData = await uploadRes.json();

    const getReq = new Request(`https://afroup.test${uploadData.url}`);
    const getRes = await worker.fetch(getReq, env);

    expect(getRes.status).toBe(200);
    expect(getRes.headers.get("content-type")).toBe("image/jpeg");
    expect(getRes.headers.get("cache-control")).toContain("immutable");
  });

  test("rejects non-image files", async () => {
    const { env } = createEnv();
    const formData = new FormData();
    const fakeFile = new Blob(["malicious script"], { type: "application/javascript" });
    formData.append("file", fakeFile, "test.js");

    const req = new Request("https://afroup.test/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Formato de imagen no permitido");
  });

  test("returns 404 for non-existent image keys", async () => {
    const { env } = createEnv();
    const req = new Request("https://afroup.test/api/uploads/non-existent.webp");
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(404);
  });

  test("HTML sanitizer allows uploaded images and strips unsafe attributes", async () => {
    const { env } = createEnv();
    const payload = {
      department: "choco",
      category: "Punto de acopio",
      information: `<p>Foto del centro:</p><p><img src="/api/uploads/12345.webp" onerror="alert(1)" alt="Centro" /></p>`,
    };

    let insertedInformation = "";
    env.DB.prepare = (sql) => {
      const stmt = {
        bind(...args) {
          if (sql.includes("INSERT INTO aid_entries")) {
            insertedInformation = args[3];
          }
          return stmt;
        },
        first: async () => ({ id: 1 }),
        run: async () => ({ meta: { last_row_id: 1 } }),
      };
      return stmt;
    };

    const req = new Request("https://afroup.test/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(201);
    expect(insertedInformation).toContain('<img src="/api/uploads/12345.webp" alt="Centro" loading="lazy">');
    expect(insertedInformation).not.toContain("onerror");
    expect(insertedInformation).not.toContain("alert");
  });
});
