import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { getLocale, restoreLocale, subscribeLocale, translate, type Locale } from "@/lib/i18n";
import { useRouterState } from "@tanstack/react-router";

const LanguageContext = createContext<Locale>("fr");
export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => "fr" as Locale);
  useEffect(() => { restoreLocale(); }, []);
  return <LanguageContext.Provider value={locale}><LanguageMetadata />{children}</LanguageContext.Provider>;
}
function LanguageMetadata() {
  const { locale } = useTranslation();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const originalsRef = useRef(new WeakMap<Element, { original: string; last: string }>());
  useEffect(() => {
    const originals = originalsRef.current;
    const update = () => {
      document.documentElement.lang = locale;
      for (const element of document.head.querySelectorAll('title, meta[name="description"], meta[property="og:title"], meta[property="og:description"]')) {
        const current = element.tagName === "TITLE" ? element.textContent ?? "" : element.getAttribute("content") ?? "";
        const saved = originals.get(element);
        const original = saved?.last === current ? saved.original : current;
        const result = translate(original, locale);
        originals.set(element, { original, last: result });
        if (current !== result) {
          if (element.tagName === "TITLE") element.textContent = result;
          else element.setAttribute("content", result);
        }
      }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["content"] });
    return () => observer.disconnect();
  }, [locale, path]);
  return null;
}
export function useTranslation() {
  const locale = useContext(LanguageContext);
  return { locale, t: (source: string, ...values: unknown[]) => translate(source, locale, values) };
}
export function T({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return <>{typeof children === "string" ? t(children) : children}</>;
}