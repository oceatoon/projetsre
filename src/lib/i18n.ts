import en from "./locales/en.json";
import it from "./locales/it.json";
import es from "./locales/es.json";

export const LANGUAGES = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "it", name: "Italiano" },
  { code: "es", name: "Español" },
] as const;
export type Locale = (typeof LANGUAGES)[number]["code"];
export const LOCALE_STORAGE_KEY = "projets.re.language";
const catalogs: Record<string, Record<string, string>> = { en, it, es };
const formats = { fr: "fr-FR", en: "en-GB", it: "it-IT", es: "es-ES" };
let clientLocale: Locale = "fr";
const listeners = new Set<() => void>();

export function isLocale(value: unknown): value is Locale {
  return LANGUAGES.some((language) => language.code === value);
}
export function getLocale(): Locale { return clientLocale; }
export function localeFormat(locale = getLocale()) { return formats[locale]; }
export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function setLocale(locale: Locale) {
  clientLocale = locale;
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* Storage may be disabled. */ }
    document.documentElement.lang = locale;
  }
  listeners.forEach((listener) => listener());
}
export function restoreLocale() {
  try {
    const requested = new URLSearchParams(window.location.search).get("lang");
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(requested)) setLocale(requested);
    else if (isLocale(saved)) setLocale(saved);
  } catch { /* Keep French when browser storage is unavailable. */ }
}

/** Original French remains the key; IDs, submitted data and domain rules stay unchanged. */
export function translate(source: string, locale: Locale = getLocale(), values: readonly unknown[] = []) {
  if (typeof source !== "string") return source;
  const key = source.replace(/\s+/g, " ").trim();
  const frenchAliases: Record<string, string> = { "{0} projects displayed": "{0} projets affichés", "{0} projects for you": "{0} projets pour vous" };
  let text = locale === "fr" ? (frenchAliases[key] ?? source) : catalogs[locale]?.[key];
  if (text === undefined && locale !== "fr") {
    for (const [pattern, translated] of Object.entries(catalogs[locale] ?? {})) {
      if (!/\{\d+\}/.test(pattern) || /[<>]/.test(pattern)) continue;
      const slots: string[] = [];
      const escaped = pattern.split(/(\{\d+\})/).map((part) => {
        if (/^\{\d+\}$/.test(part)) { slots.push(part); return "(.+?)"; }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }).join("");
      const matched = key.match(new RegExp(`^${escaped}$`));
      if (matched) {
        text = translated;
        slots.forEach((slot, index) => { text = text?.replaceAll(slot, matched[index + 1] ?? ""); });
        break;
      }
    }
  }
  text ??= source;
  if (locale !== "fr" && text !== source) {
    text = (source.match(/^\s+/)?.[0] ?? "") + text + (source.match(/\s+$/)?.[0] ?? "");
  }
  return text.replace(/\{(\d+)\}/g, (match, index: string) => {
    const value = values[Number(index)];
    return value === undefined ? match : String(value);
  });
}