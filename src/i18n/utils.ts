import type { Locale } from "./types";

export const locales: Locale[] = ["en", "de", "ru"];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function localePath(locale: Locale, hash = ""): string {
  const base = `/${locale}/`;
  return hash ? `${base}${hash.startsWith("#") ? hash : `#${hash}`}` : base;
}
