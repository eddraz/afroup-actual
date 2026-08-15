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
  store: "tienda",
  product: "producto",
  cart: "#",
  resources: "recursos",
  resource: "recurso",
  donate: "donacion",
  about: "nosotros",
  contact: "contacto",
  support: "apoyanos",
  community: "comunidad",
  projects: "proyectos",
  project: "proyecto",
  entrepreneurs: "emprendedores",
  entrepreneur: "emprendimiento",
  people: "referentes",
  person: "#",
  collaborate: "colabora",
  saved: "guardados",
  login: "login",
  signup: "registro",
  recover: "recuperar",
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
  store: "/tienda",
  product: "/producto",
  cart: "#",
  resources: "/recursos",
  resource: "/recurso",
  donate: "/donacion",
  about: "/nosotros",
  contact: "/contacto",
  support: "/apoyanos",
  community: "/comunidad",
  projects: "/proyectos",
  project: "/proyecto",
  entrepreneurs: "/emprendedores",
  entrepreneur: "/emprendimiento",
  people: "/referentes",
  person: "#",
  collaborate: "/colabora",
  saved: "/guardados",
  login: "/login",
  signup: "/registro",
  recover: "/recuperar",
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
  | "login"
  | "signup"
  | "recover"
  | "donar";

export const socials = [
  { href: "https://www.instagram.com/afroup/", label: "Instagram", icon: "ic-ig" },
  { href: "https://www.tiktok.com/@afroup", label: "TikTok", icon: "ic-tiktok" },
  { href: "https://www.youtube.com/afroup", label: "YouTube", icon: "ic-youtube" },
  { href: "https://www.facebook.com/AfroUp/", label: "Facebook", icon: "ic-facebook" },
  { href: "https://x.com/afroup_", label: "X", icon: "ic-x" },
  { href: "https://www.threads.com/@afroup", label: "Threads", icon: "ic-threads" },
] as const;
