export const routeIds = {
  home: "/",
  search: "buscar",
  africa: "africa",
  diaspora: "diaspora",
  antirracismo: "antirracismo",
  historia: "historia",
  estetica: "estetica",
  actualidad: "actualidad",
  category: "#",
  article: "articulo",
  store: "#",
  product: "#",
  cart: "#",
  resources: "recursos",
  donate: "donacion",
  about: "nosotros",
  contact: "contacto",
  support: "apoyanos",
  projects: "proyectos",
  project: "#",
  entrepreneurs: "#",
  entrepreneur: "#",
  people: "#",
  person: "#",
  collaborate: "colabora",
  sitemap: "#",
} as const;

export const paths = {
  home: "/",
  search: "/buscar",
  africa: "/africa",
  diaspora: "/diaspora",
  antirracismo: "/antirracismo",
  historia: "/historia",
  estetica: "/estetica",
  actualidad: "/actualidad",
  category: "#",
  article: "/articulo",
  store: "#",
  product: "#",
  cart: "#",
  resources: "/recursos",
  donate: "/donacion",
  about: "/nosotros",
  contact: "/contacto",
  support: "/apoyanos",
  projects: "/proyectos",
  project: "#",
  entrepreneurs: "#",
  entrepreneur: "#",
  people: "#",
  person: "#",
  collaborate: "/colabora",
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
