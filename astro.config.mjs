import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  adapter: cloudflare({
    platformProxy: { enabled: true },
    sessionKVBindingName: "SESSION",
  }),
  output: "server",
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  image: {
    domains: [
      "images.unsplash.com",
      "cloudflare-ipfs.com",
      "avatars.githubusercontent.com",
    ],
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.afroup.com" },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
