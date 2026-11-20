import { T, useTranslation } from "@/components/language-provider";
import { translate } from "@/lib/i18n";
import { Link, useRouter } from "@tanstack/react-router";
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
import { useSession } from "@/hooks/use-session";
import { SUPPORT_KINDS } from "@/lib/domain";
import { addSupportAsUser } from "@/lib/participate.functions";

export function SupportForm({ projectId }: { projectId: string }) {
  useTranslation();
  const send = useServerFn(addSupportAsUser);
  const router = useRouter();
  const { ready, signedIn } = useSession();
  const [kind, setKind] = useState<string>("benevole");
  const [contact, setContact] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await send({
        data: {
          project_id: projectId,
          kind: kind as "don" | "benevole" | "testeur" | "soutien",
          contact: contact.trim(),
          amount: kind === "don" && amount ? Number(amount) : null,
          message: message.trim(),
        },
      });
      setMessage("");
      setAmount("");
      toast.success(translate("Votre soutien est enregistré, le porteur peut vous recontacter."));
      await router.invalidate();
    } catch {
      toast.error(translate("Enregistrement impossible pour le moment."));
    } finally {
      setBusy(false);
    }
  };

  if (ready && !signedIn) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-5">
        <h3 className="font-display text-lg"><T>{"Soutenir ce projet"}</T></h3>
        <p className="mt-2 text-sm text-muted-foreground"><T>{" Connectez-vous pour proposer votre aide, votre temps ou une intention de financement : le porteur pourra vous recontacter. "}</T></p>
        <Button asChild className="mt-4">
          <Link to="/connexion"><T>{"Me connecter"}</T></Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg"><T>{"Soutenir ce projet"}</T></h3>
      <p className="mt-1 text-sm text-muted-foreground"><T>{" Les intentions de financement ne sont pas des paiements : le porteur vous recontacte pour la suite. "}</T></p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="su-kind"><T>{"Comment ?"}</T></Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger id="su-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORT_KINDS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <T>{item.label}</T>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="su-contact"><T>{"Contact (courriel ou téléphone)"}</T></Label>
          <Input
            id="su-contact"
            value={contact}
            maxLength={160}
            onChange={(event) => setContact(event.target.value)}
            placeholder={translate("Facultatif")}
          />
        </div>
        <T>{kind === "don" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="su-amount"><T>{"Montant envisagé (€)"}</T></Label>
            <Input
              id="su-amount"
              type="number"
              min={0}
              max={1000000}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        ) : null}</T>
      </div>
      <div className="mt-3 grid gap-1.5">
        <Label htmlFor="su-message"><T>{"Message au porteur"}</T></Label>
        <Textarea
          id="su-message"
          value={message}
          maxLength={1000}
          rows={3}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={translate("Ce que vous pouvez apporter, vos disponibilités…")}
        />
      </div>
      <Button type="submit" className="mt-4" disabled={busy}>
        <T>{busy ? "Envoi…" : "Enregistrer mon soutien"}</T>
      </Button>
    </form>
  );
}
