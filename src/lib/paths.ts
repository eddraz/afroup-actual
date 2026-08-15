export const routeIds = {
  home: "/",
  search: "buscar",
  africa: "africa",
  category: "#",
  article: "#",
  store: "#",
  product: "#",
  cart: "#",
  resources: "#",
  donate: "#",
  about: "#",
  contact: "#",
  support: "#",
  projects: "#",
  project: "#",
  entrepreneurs: "#",
  entrepreneur: "#",
  people: "#",
  person: "#",
  collaborate: "#",
  sitemap: "#",
} as const;

export const paths = {
  home: "/",
  search: "/buscar",
  africa: "/africa",
  category: "#",
  article: "#",
  store: "#",
  product: "#",
  cart: "#",
  resources: "#",
  donate: "#",
  about: "#",
  contact: "#",
  support: "#",
  projects: "#",
  project: "#",
  entrepreneurs: "#",
  entrepreneur: "#",
  people: "#",
  person: "#",
  collaborate: "#",
  sitemap: "#",
} as const;

export type NavKey =
  | "inicio"
  | "buscar"
  | "africa"
  | "diaspora"
  | "antirracismo"
  | "historia"
  | "estetica"
  | "actualidad"
  | "tienda"
  | "recursos"
  | "comunidad"
  | "guardados"
  | "donar";
