import { getRelativeLocaleUrl } from "astro:i18n";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

const dictionaries = {
  es: {
    titleHome: "AfroUp — Inicio",
    titleSearch: "AfroUp — Búsqueda",
    navHome: "Inicio",
    navSearch: "Buscar",
    navLearn: "Aprende",
    navAfrica: "África",
    navDiaspora: "Diáspora",
    navAntiracism: "Antirracismo",
    navHistory: "Historia",
    navAesthetics: "Estética",
    navCurrent: "Actualidad",
    navCommunity: "Comunidad",
    navStore: "Tienda",
    navResources: "Recursos",
    navSaved: "Guardados",
    navDonate: "Donar",
    donateCta: "Haz tu Donación",
    searchPlaceholder: "Busca temas, artículos, autores…",
    searchAria: "Buscar",
    searchSubmit: "Buscar",
    mantra: "Conocimiento = poder",
    menuAria: "Menú",
    closeMenuAria: "Cerrar menú",
    themeAria: "Cambiar tema",
    footerAfroup: "AfroUp",
    footerAbout: "Nosotros",
    footerContact: "Contacto",
    footerSupport: "Apóyanos",
    footerProjects: "Proyectos",
    footerEntrepreneurs: "Emprendedores",
    footerPeople: "Referentes",
    footerCollaborate: "Colabora",
    footerContactUs: "Contáctanos",
    footerFollow: "Síguenos",
    searchChipAll: "Todo",
    searchChipArticles: "Artículos",
    searchChipStore: "Tienda",
    searchChipResources: "Recursos",
    searchChipProjects: "Proyectos",
    searchResultsFor: "resultados",
    searchResultsPreposition: "para",
    searchLoadMore: "Cargar más resultados",
    searchDownload: "Descargar",
  },
  en: {
    titleHome: "AfroUp — Home",
    titleSearch: "AfroUp — Search",
    navHome: "Home",
    navSearch: "Search",
    navLearn: "Learn",
    navAfrica: "Africa",
    navDiaspora: "Diaspora",
    navAntiracism: "Antiracism",
    navHistory: "History",
    navAesthetics: "Aesthetics",
    navCurrent: "News",
    navCommunity: "Community",
    navStore: "Store",
    navResources: "Resources",
    navSaved: "Saved",
    navDonate: "Donate",
    donateCta: "Make a Donation",
    searchPlaceholder: "Search topics, articles, authors…",
    searchAria: "Search",
    searchSubmit: "Search",
    mantra: "Knowledge = power",
    menuAria: "Menu",
    closeMenuAria: "Close menu",
    themeAria: "Toggle theme",
    footerAfroup: "AfroUp",
    footerAbout: "About",
    footerContact: "Contact",
    footerSupport: "Support us",
    footerProjects: "Projects",
    footerEntrepreneurs: "Entrepreneurs",
    footerPeople: "People",
    footerCollaborate: "Collaborate",
    footerContactUs: "Contact us",
    footerFollow: "Follow us",
    searchChipAll: "All",
    searchChipArticles: "Articles",
    searchChipStore: "Store",
    searchChipResources: "Resources",
    searchChipProjects: "Projects",
    searchResultsFor: "results",
    searchResultsPreposition: "for",
    searchLoadMore: "Load more results",
    searchDownload: "Download",
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function isLocale(value: string | undefined): value is Locale {
  return value === "es" || value === "en";
}

export function getLocaleFromUrl(url: URL): Locale {
  const first = url.pathname.split("/").filter(Boolean)[0];
  return isLocale(first) ? first : defaultLocale;
}

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function localizedPath(locale: Locale, path: string): string {
  const clean = path === "/" ? "/" : path.replace(/^\//, "");
  return getRelativeLocaleUrl(locale, clean);
}

export function switchLocalePath(currentUrl: URL, nextLocale: Locale): string {
  const segments = currentUrl.pathname.split("/").filter(Boolean);
  if (isLocale(segments[0])) segments.shift();
  const rest = segments.join("/");
  const nextPath = localizedPath(nextLocale, rest ? `/${rest}` : "/");
  return `${nextPath}${currentUrl.search}`;
}
