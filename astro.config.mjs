// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  output: "static",
  i18n: {
    locales: ["en", "de", "ru"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    format: "directory",
  },
  server: {
    allowedHosts: true,
  },
  vite: {
    define: {
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
    },
  },
});
