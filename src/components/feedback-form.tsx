import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addFeedback } from "@/lib/data.functions";
import { FEEDBACK_KINDS } from "@/lib/domain";

export function FeedbackForm({ projectId }: { projectId: string }) {
  const send = useServerFn(addFeedback);
  const router = useRouter();
  const [author, setAuthor] = useState("");
  const [kind, setKind] = useState<string>("avis");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<string>("4");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (body.trim().length < 3) {
      toast.error("Écrivez quelques mots avant d'envoyer.");
      return;
    }
    setBusy(true);
    try {
      await send({
        data: {
          project_id: projectId,
          author_name: author.trim() || "Anonyme",
          kind: kind as "avis" | "idee" | "critique",
          body: body.trim(),
          rating: Number(rating),
        },
      });
      setBody("");
      toast.success("Merci, votre contribution est publiée.");
      await router.invalidate();
    } catch {
      toast.error("Envoi impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg">Donner mon avis</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="fb-name">Votre nom</Label>
          <Input
            id="fb-name"
            value={author}
            maxLength={80}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Anonyme"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fb-kind">Type</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger id="fb-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_KINDS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fb-rating">Intérêt du projet</Label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger id="fb-rating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 4, 3, 2, 1].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} / 5
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 grid gap-1.5">
        <Label htmlFor="fb-body">Votre message</Label>
        <Textarea
          id="fb-body"
          value={body}
          maxLength={2000}
          rows={4}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Ce qui vous semble utile, ce qui manque, une idée pour aller plus loin…"
        />
      </div>
      <Button type="submit" className="mt-4" disabled={busy}>
        {busy ? "Envoi…" : "Publier ma contribution"}
      </Button>
    </form>
  );
}
