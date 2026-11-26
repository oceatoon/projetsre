import { useState } from "react";
import { toast } from "sonner";

import { T } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { translate } from "@/lib/i18n";

type Target = { kind: "projet"; projectId: string } | { kind: "partenaire"; partnerSlug: string };

export function EventForm({ target, onCreated }: { target: Target; onCreated: () => void }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "", starts_at: "", location: "", description: "", visibility: "public" });
  if (!user) return null;
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}><T>Ajouter un événement</T></Button>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.title.trim().length < 3 || !f.starts_at) { toast.error(translate("Titre et date requis.")); return; }
    setBusy(true);
    const base = {
      title: f.title.trim().slice(0, 160), description: f.description.trim().slice(0, 2000),
      location: f.location.trim().slice(0, 160), starts_at: new Date(f.starts_at).toISOString(),
      visibility: f.visibility, author_id: user!.id,
    };
    const { error } = target.kind === "projet"
      ? await supabase.from("events").insert({ ...base, project_id: target.projectId })
      : await supabase.from("partner_events").insert({ ...base, partner_slug: target.partnerSlug });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(translate("Événement ajouté."));
    setF({ title: "", starts_at: "", location: "", description: "", visibility: "public" });
    setOpen(false);
    onCreated();
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
      <Input placeholder={translate("Titre")} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="sm:col-span-2" />
      <Input type="datetime-local" aria-label={translate("Date")} value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
      <Input placeholder={translate("Lieu")} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
      <Textarea placeholder={translate("Description")} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="sm:col-span-2" />
      <select value={f.visibility} onChange={(e) => setF({ ...f, visibility: e.target.value })} className="rounded-md border bg-background px-2 py-2 text-sm">
        <option value="public">{translate("Public — visible dans l'agenda global")}</option>
        <option value="private">{translate(target.kind === "projet" ? "Privé — visible par le porteur seulement" : "Privé — visible par l'équipe partenaire")}</option>
      </select>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}><T>Enregistrer</T></Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}><T>Annuler</T></Button>
      </div>
    </form>
  );
}
