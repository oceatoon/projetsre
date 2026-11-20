import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "./language-provider";
import { LANGUAGES, setLocale } from "@/lib/i18n";

export function LanguageSelector() {
  const { locale } = useTranslation();
  const label = { fr: "Choisir la langue", en: "Choose language", it: "Scegli la lingua", es: "Elegir idioma" }[locale];
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" aria-label={label} title={label} className="shrink-0 gap-1 px-2">
        <Languages className="size-4" /><span className="text-xs uppercase">{locale}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {LANGUAGES.map((language) => <DropdownMenuItem key={language.code} onSelect={() => setLocale(language.code)} className="justify-between gap-6">
        <span lang={language.code}>{language.name}</span>{locale === language.code && <Check className="size-4" />}
      </DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}