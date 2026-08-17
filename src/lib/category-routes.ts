const RESERVED_CATEGORY_SLUGS = new Set([
  "admin",
  "api",
  "apoyanos",
  "articulo",
  "articulos",
  "assets",
  "buscar",
  "colabora",
  "comunidad",
  "contacto",
  "cuenta",
  "donacion",
  "emprendedores",
  "emprendimiento",
  "en",
  "guardados",
  "login",
  "nosotros",
  "producto",
  "proyecto",
  "proyectos",
  "recuperar",
  "recurso",
  "recursos",
  "referentes",
  "registro",
  "tienda",
  "verificar",
]);

export function isReservedCategorySlug(slug: string): boolean {
  return RESERVED_CATEGORY_SLUGS.has(slug.trim().toLowerCase());
}

export type CategoryTheme = {
  textClass: string;
  dotClass: string;
};

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  africa: { textClass: "text-primary", dotClass: "bg-primary" },
  diaspora: { textClass: "text-accent", dotClass: "bg-accent" },
  antirracismo: { textClass: "text-secondary", dotClass: "bg-secondary" },
  historia: { textClass: "text-secondary", dotClass: "bg-secondary" },
  estetica: { textClass: "text-accent", dotClass: "bg-accent" },
  actualidad: { textClass: "text-primary", dotClass: "bg-primary" },
};

export function getCategoryTheme(slug: string): CategoryTheme {
  const key = slug.trim().toLowerCase();
  return CATEGORY_THEMES[key] ?? { textClass: "text-primary", dotClass: "bg-primary" };
}
