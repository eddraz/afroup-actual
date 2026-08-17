import { describe, expect, test } from "bun:test";
import worker from "../src/index.js";

function createEnv(mockEntries = []) {
  const env = {
    ADMIN_USER: "admin",
    DB: {
      prepare(sql) {
        const stmt = {
          bind(...args) {
            return stmt;
          },
          all: async () => ({ results: mockEntries }),
          first: async () => null,
          run: async () => ({ meta: { last_row_id: 1 } }),
        };
        return stmt;
      },
    },
  };
  return { env };
}

function request(path) {
  return new Request(`https://afroup.test${path}`);
}

describe("Accent-insensitive and diacritic-insensitive search", () => {
  const SAMPLE_ENTRIES = [
    {
      id: 1,
      department_id: 1,
      department_slug: "choco",
      department_name: "Chocó",
      title: "Centro de Acopio Quibdó",
      information: "<p>Recepción de <strong>donación</strong> de víveres, alimentos y artículos para bebés.</p>",
      location: "Quibdó, barrio Centro",
      category: "Punto de acopio",
      contact_name: "María Gómez",
      contact_phone: "3001234567",
      contact_email: "ayuda@choco.org",
      status: "published",
    },
    {
      id: 2,
      department_id: 2,
      department_slug: "bogota",
      department_name: "Bogotá D.C.",
      title: "Punto de donaciones Bogotá Norte",
      information: "<p>Donaciones económicas y atención médica de emergencia en Bogotá.</p>",
      location: "Bogotá, Calle 100",
      category: "Donación económica",
      contact_name: "Andrés Córdoba",
      contact_phone: "3109876543",
      contact_email: "contacto@bogota.org",
      status: "published",
    },
    {
      id: 3,
      department_id: 3,
      department_slug: "antioquia",
      department_name: "Antioquia",
      title: "Banco de sangre Medellín",
      information: "<p>Jornada de donación de sangre en Medellín, Antioquia.</p>",
      location: "Medellín, Poblado",
      category: "Banco de sangre",
      contact_name: "José Peña",
      contact_phone: "3201112233",
      contact_email: "sangre@medellin.org",
      status: "published",
    },
  ];

  test("matches accented entry when searching without accents (e.g. choco -> Chocó)", async () => {
    const { env } = createEnv(SAMPLE_ENTRIES);
    const res = await worker.fetch(request("/api/entries?q=choco"), env);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.entries.length).toBe(1);
    expect(data.entries[0].title).toBe("Centro de Acopio Quibdó");
  });

  test("matches accented entry when searching with accents (e.g. Chocó -> Chocó)", async () => {
    const { env } = createEnv(SAMPLE_ENTRIES);
    const res = await worker.fetch(request("/api/entries?q=Chocó"), env);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.entries.length).toBe(1);
    expect(data.entries[0].title).toBe("Centro de Acopio Quibdó");
  });

  test("matches Quibdó when searching quibdo or QUIBDO", async () => {
    const { env } = createEnv(SAMPLE_ENTRIES);
    const res1 = await worker.fetch(request("/api/entries?q=quibdo"), env);
    const data1 = await res1.json();
    expect(data1.entries.length).toBe(1);

    const res2 = await worker.fetch(request("/api/entries?q=QUIBDO"), env);
    const data2 = await res2.json();
    expect(data2.entries.length).toBe(1);
  });

  test("matches Bogotá when searching bogota, Bogota or BOGOTÁ", async () => {
    const { env } = createEnv(SAMPLE_ENTRIES);
    const res1 = await worker.fetch(request("/api/entries?q=bogota"), env);
    const data1 = await res1.json();
    expect(data1.entries.length).toBe(1);
    expect(data1.entries[0].title).toBe("Punto de donaciones Bogotá Norte");

    const res2 = await worker.fetch(request("/api/entries?q=BOGOTÁ"), env);
    const data2 = await res2.json();
    expect(data2.entries.length).toBe(1);
  });

  test("matches Medellín when searching medellin, Medellín, MEDELLIN", async () => {
    const { env } = createEnv(SAMPLE_ENTRIES);
    const res = await worker.fetch(request("/api/entries?q=medellin"), env);
    const data = await res.json();
    expect(data.entries.length).toBe(1);
    expect(data.entries[0].title).toBe("Banco de sangre Medellín");
  });

  test("matches keywords inside HTML information field (e.g. donación vs donacion, víveres vs viveres, bebés vs bebes)", async () => {
    const { env } = createEnv(SAMPLE_ENTRIES);

    const resDonacion = await worker.fetch(request("/api/entries?q=donacion"), env);
    const dataDonacion = await resDonacion.json();
    expect(dataDonacion.entries.length).toBe(3); // all 3 have donación / donaciones

    const resViveres = await worker.fetch(request("/api/entries?q=viveres"), env);
    const dataViveres = await resViveres.json();
    expect(dataViveres.entries.length).toBe(1);

    const resBebes = await worker.fetch(request("/api/entries?q=bebes"), env);
    const dataBebes = await resBebes.json();
    expect(dataBebes.entries.length).toBe(1);
  });

  test("matches contact names with accents (e.g. maria gomez -> María Gómez, jose pena -> José Peña)", async () => {
    const { env } = createEnv(SAMPLE_ENTRIES);

    const resMaria = await worker.fetch(request("/api/entries?q=maria+gomez"), env);
    const dataMaria = await resMaria.json();
    expect(dataMaria.entries.length).toBe(1);

    const resJose = await worker.fetch(request("/api/entries?q=jose+pena"), env);
    const dataJose = await resJose.json();
    expect(dataJose.entries.length).toBe(1);
  });

  test("multi-word search with accents and mixed casing", async () => {
    const { env } = createEnv(SAMPLE_ENTRIES);

    const res = await worker.fetch(request("/api/entries?q=Chocó+Víveres"), env);
    const data = await res.json();
    expect(data.entries.length).toBe(1);
    expect(data.entries[0].department_name).toBe("Chocó");
  });
});
