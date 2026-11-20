import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SECTIONS } from "@/lib/domain";
import { buildDossier, printHtml } from "@/lib/dossier";
import type { Call, ProjectDetail } from "@/lib/types";

export function DossierExport({
  detail,
  call,
  answers,
  label = "Exporter le dossier en PDF",
}: {
  detail: ProjectDetail;
  call?: Call | null;
  answers?: { question: string; answer: string }[];
  label?: string;
}) {
  useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(SECTIONS.map((s) => s.value));

  const toggle = (value: string) =>
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  const handleExport = () => {
    const ordered = SECTIONS.filter((s) => selected.includes(s.value)).map((s) => s.value);
    const html = buildDossier({ detail, sections: ordered, call: call ?? null, answers });
    const ok = printHtml(html);
    if (!ok) {
      toast.error(translate("Autorisez les fenêtres surgissantes pour générer le PDF."));
      return;
    }
    setOpen(false);
    toast.success(translate("Dossier prêt : choisissez « Enregistrer au format PDF »."));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Printer className="size-4" /> <T>{label}</T>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle><T>{"Composer le dossier"}</T></DialogTitle>
          <DialogDescription><T>{" Choisissez les parties de la fiche à inclure. Le dossier s'ouvre dans une nouvelle fenêtre : enregistrez-le au format PDF. "}</T></DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <div key={section.value} className="flex items-start gap-2">
              <Checkbox
                id={`section-${section.value}`}
                checked={selected.includes(section.value)}
                onCheckedChange={() => toggle(section.value)}
              />
              <Label htmlFor={`section-${section.value}`} className="text-sm leading-snug">
                <T>{section.label}</T>
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleExport} disabled={selected.length === 0}>
            <Printer className="size-4" /><T>{" Générer le dossier "}</T></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
