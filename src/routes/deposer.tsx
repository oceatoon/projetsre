import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { draftProject, improveText } from "@/lib/ai.functions";
import { useSession } from "@/hooks/use-session";
import { createProjectAsUser } from "@/lib/participate.functions";
import { COMMUNES, NEED_TYPES, STAGES, THEMES } from "@/lib/domain";
import { emptyRatings, IMPACT_AXES, type AxisRating } from "@/lib/impact";
import { saveImpactDiagnostic } from "@/lib/impact.functions";
import { ImpactRadar } from "@/components/impact-radar";

export const Route = createFileRoute("/deposer")({
  head: () => ({
    meta: [
      { title: "Déposer un projet — projets.re" },
      {
        name: "description",
        content:
          "Créez votre fiche projet unique : racontez votre idée, l'assistant structure le dossier, les jalons et les besoins.",
      },
      { property: "og:title", content: "Déposer un projet — projets.re" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Une fiche unique, réutilisable pour tous les appels à projets réunionnais.",
      },
    ],
  }),
  component: DepositPage,
});

interface Milestone {
  title: string;
  description: string;
  due_date: string;
}

const STEPS = ["Votre récit", "La fiche", "Besoins et budget", "Passage à l'action", "Impact"];

function DepositPage() {
  const saveImpact = useServerFn(saveImpactDiagnostic);
  const [ratings, setRatings] = useState<AxisRating[]>(emptyRatings());
  const navigate = useNavigate();
  const draft = useServerFn(draftProject);
  const improve = useServerFn(improveText);
  const save = useServerFn(createProjectAsUser);
  const { ready, signedIn } = useSession();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pitch, setPitch] = useState("");

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [valueAdded, setValueAdded] = useState("");
  const [needsAnswered, setNeedsAnswered] = useState("");
  const [objectives, setObjectives] = useState<string[]>(["", "", ""]);
  const [commune, setCommune] = useState("");
  const [theme, setTheme] = useState("social");
  const [stage, setStage] = useState("idee");
  const [needTypes, setNeedTypes] = useState<string[]>([]);
  const [budgetNeeded, setBudgetNeeded] = useState("");
  const [budgetSecured, setBudgetSecured] = useState("");
  const [carrier, setCarrier] = useState("");
  const [email, setEmail] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "", description: "", due_date: "" },
  ]);
  const [actions, setActions] = useState<string[]>([""]);
  const [partners, setPartners] = useState<string[]>([]);

  const generate = async () => {
    if (pitch.trim().length < 10) {
      toast.error("Racontez votre projet en quelques phrases d'abord.");
      return;
    }
    setBusy(true);
    try {
      const result = await draft({ data: { pitch: pitch.trim() } });
      setName(result.name);
      setTagline(result.tagline);
      setDescription(result.description);
      setValueAdded(result.value_added);
      setNeedsAnswered(result.needs_answered);
      setObjectives(result.objectives.length ? result.objectives : ["", "", ""]);
      if (result.commune) setCommune(result.commune);
      if (result.theme) setTheme(result.theme);
      if (result.stage) setStage(result.stage);
      setNeedTypes(result.need_types);
      setPartners(result.partners);
      setMilestones(
        result.milestones.length
          ? result.milestones.map((item) => ({ ...item, due_date: "" }))
          : [{ title: "", description: "", due_date: "" }],
      );
      setActions(result.actions.length ? result.actions : [""]);
      toast.success("Première version rédigée : à vous de la corriger.");
      setStep(1);
    } catch {
      toast.error("L'assistant est indisponible. Vous pouvez remplir la fiche à la main.");
      setStep(1);
    } finally {
      setBusy(false);
    }
  };

  const polish = async (
    section: string,
    content: string,
    apply: (value: string) => void,
  ) => {
    if (content.trim().length < 5) {
      toast.error("Écrivez d'abord quelques mots.");
      return;
    }
    setBusy(true);
    try {
      const result = await improve({
        data: { section, content: content.trim(), context: `${name} — ${tagline}` },
      });
      apply(result.text);
      toast.success("Texte retravaillé par l'assistant.");
    } catch {
      toast.error("L'assistant est indisponible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (ready && !signedIn) {
      toast.error("Connectez-vous pour publier votre fiche projet.");
      return;
    }
    if (name.trim().length < 2 || tagline.trim().length < 3) {
      toast.error("Un nom et une phrase de présentation sont nécessaires.");
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const result = await save({
        data: {
          name: name.trim(),
          tagline: tagline.trim(),
          description: description.trim(),
          value_added: valueAdded.trim(),
          needs_answered: needsAnswered.trim(),
          objectives: objectives.map((o) => o.trim()).filter(Boolean),
          commune: commune.trim(),
          theme,
          stage,
          need_types: needTypes,
          budget_needed: Number(budgetNeeded || 0),
          budget_secured: Number(budgetSecured || 0),
          carrier_name: carrier.trim() || name.trim(),
          contact_email: email.trim(),
          milestones: milestones
            .filter((m) => m.title.trim().length > 1)
            .map((m) => ({
              title: m.title.trim(),
              description: m.description.trim(),
              due_date: m.due_date,
            })),
          actions: actions
            .filter((a) => a.trim().length > 1)
            .map((a) => ({ title: a.trim(), author_name: carrier.trim() || "Le porteur" })),
        },
      });
      if (ratings.some((r) => r.typology !== null || r.current_score !== null || r.target_score !== null || r.evidence.trim())) {
        try { await saveImpact({ data: { project_id: result.id, axes: ratings } }); } catch { toast.error("Fiche publiée, mais le diagnostic d'impact n'a pas pu être enregistré."); }
      }
      toast.success("Votre fiche projet est publiée.");
      await navigate({ to: "/projets/$slug", params: { slug: result.slug } });
    } catch {
      toast.error("Publication impossible. Vérifiez les champs et réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const toggleNeed = (value: string) =>
    setNeedTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold">Déposer mon projet</h1>
      <p className="mt-2 text-muted-foreground">
        Une seule fois. Cette fiche servira pour tous vos appels à projets et s'enrichira au fil des
        questions.
      </p>

      <div className="mt-8">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <div className="mt-3 flex flex-wrap gap-2">
          {STEPS.map((label, index) => (
            <Badge key={label} variant={index === step ? "default" : "outline"}>
              {index + 1}. {label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        {step === 0 ? (
          <div>
            <h2 className="font-display text-2xl">Racontez votre projet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Écrivez comme vous le diriez à un voisin : le problème constaté, ce que vous voulez
              faire, pour qui, où. L'assistant s'occupe de la mise en forme.
            </p>
            <Textarea
              className="mt-4"
              rows={10}
              maxLength={4000}
              value={pitch}
              onChange={(event) => setPitch(event.target.value)}
              placeholder="Dans mon quartier, les jeunes n'ont pas d'endroit pour réviser après l'école. On voudrait ouvrir une salle avec du tutorat…"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={generate} disabled={busy}>
                <Sparkles className="size-4" />
                {busy ? "Rédaction en cours…" : "Structurer avec l'assistant"}
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Remplir moi-même
              </Button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="font-display text-2xl">La fiche projet</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du projet" id="p-name">
                <Input id="p-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Porteur (personne ou structure)" id="p-carrier">
                <Input
                  id="p-carrier"
                  value={carrier}
                  maxLength={120}
                  onChange={(e) => setCarrier(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Phrase de présentation" id="p-tagline">
              <Input
                id="p-tagline"
                value={tagline}
                maxLength={200}
                onChange={(e) => setTagline(e.target.value)}
              />
            </Field>
            <Field label="Description du projet" id="p-desc">
              <Textarea
                id="p-desc"
                rows={8}
                maxLength={6000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <PolishButton
                busy={busy}
                onClick={() => polish("description", description, setDescription)}
              />
            </Field>
            <Field label="Valeur ajoutée" id="p-value">
              <Textarea
                id="p-value"
                rows={3}
                maxLength={2000}
                value={valueAdded}
                onChange={(e) => setValueAdded(e.target.value)}
              />
              <PolishButton
                busy={busy}
                onClick={() => polish("valeur ajoutée", valueAdded, setValueAdded)}
              />
            </Field>
            <Field label="Besoins du territoire auxquels vous répondez" id="p-needs">
              <Textarea
                id="p-needs"
                rows={3}
                maxLength={2000}
                value={needsAnswered}
                onChange={(e) => setNeedsAnswered(e.target.value)}
              />
              <PolishButton
                busy={busy}
                onClick={() => polish("besoins auxquels le projet répond", needsAnswered, setNeedsAnswered)}
              />
            </Field>
            <div>
              <Label>Objectifs</Label>
              <div className="mt-2 space-y-2">
                {objectives.map((objective, index) => (
                  <Input
                    key={index}
                    value={objective}
                    maxLength={240}
                    placeholder={`Objectif ${index + 1}`}
                    onChange={(event) =>
                      setObjectives((current) =>
                        current.map((item, i) => (i === index ? event.target.value : item)),
                      )
                    }
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setObjectives((current) => [...current, ""])}
              >
                Ajouter un objectif
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Commune" id="p-commune">
                <Select value={commune} onValueChange={setCommune}>
                  <SelectTrigger id="p-commune">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMUNES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Thématique" id="p-theme">
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="p-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Avancement" id="p-stage">
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger id="p-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <h2 className="font-display text-2xl">De quoi avez-vous besoin ?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {NEED_TYPES.map((need) => (
                <div key={need.value} className="flex items-start gap-2">
                  <Checkbox
                    id={`need-${need.value}`}
                    checked={needTypes.includes(need.value)}
                    onCheckedChange={() => toggleNeed(need.value)}
                  />
                  <Label htmlFor={`need-${need.value}`} className="text-sm leading-snug">
                    {need.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Budget nécessaire (€)" id="p-bn">
                <Input
                  id="p-bn"
                  type="number"
                  min={0}
                  value={budgetNeeded}
                  onChange={(e) => setBudgetNeeded(e.target.value)}
                />
              </Field>
              <Field label="Financement déjà réuni (€)" id="p-bs">
                <Input
                  id="p-bs"
                  type="number"
                  min={0}
                  value={budgetSecured}
                  onChange={(e) => setBudgetSecured(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Courriel de contact" id="p-mail">
              <Input
                id="p-mail"
                type="email"
                value={email}
                maxLength={160}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Facultatif, visible par les institutions"
              />
            </Field>
            {partners.length ? (
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium">Partenaires locaux suggérés</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {partners.map((partner) => (
                    <li key={partner}>• {partner}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <h2 className="font-display text-2xl">Jalons et premières actions</h2>
            <p className="text-sm text-muted-foreground">
              Un projet crédible montre son phasage. Les actions racontées seront ensuite visibles par
              tous et validées par vos pairs.
            </p>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="rounded-lg border border-border p-4">
                  <Input
                    value={milestone.title}
                    maxLength={200}
                    placeholder={`Jalon ${index + 1}`}
                    onChange={(event) =>
                      setMilestones((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <Textarea
                    className="mt-2"
                    rows={2}
                    maxLength={1000}
                    value={milestone.description}
                    placeholder="Ce que ce jalon contient"
                    onChange={(event) =>
                      setMilestones((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, description: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <Input
                    className="mt-2"
                    type="date"
                    value={milestone.due_date}
                    onChange={(event) =>
                      setMilestones((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, due_date: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setMilestones((current) => [...current, { title: "", description: "", due_date: "" }])
              }
            >
              Ajouter un jalon
            </Button>

            <div>
              <Label>Actions déjà réalisées</Label>
              <div className="mt-2 space-y-2">
                {actions.map((action, index) => (
                  <Input
                    key={index}
                    value={action}
                    maxLength={200}
                    placeholder="Ce que vous avez déjà fait"
                    onChange={(event) =>
                      setActions((current) =>
                        current.map((item, i) => (i === index ? event.target.value : item)),
                      )
                    }
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setActions((current) => [...current, ""])}
              >
                Ajouter une action
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5">
            <h2 className="font-display text-2xl">Diagnostic d'impact</h2>
            <p className="text-sm text-muted-foreground">Facultatif. Notez de 0 à 5 la place de chaque thème dans le projet (typologie), son impact actuel et votre ambition. Vous pourrez le compléter plus tard dans l'onglet Impact.</p>
            <ImpactRadar ratings={ratings} />
            <div className="divide-y divide-border">
              {IMPACT_AXES.map((axis) => {
                const row = ratings.find((r) => r.axis === axis.key)!;
                const patch = (fields: Partial<AxisRating>) => setRatings((current) => current.map((r) => (r.axis === axis.key ? { ...r, ...fields } : r)));
                return (
                  <div key={axis.key} className="space-y-3 py-4">
                    <div><p className="font-medium">{axis.label}</p><p className="text-sm text-muted-foreground">{axis.question}</p></div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["typology", "current_score", "target_score"] as const).map((field) => (
                        <div key={field} className="grid min-w-0 gap-1 text-sm">
                          <span>{{ typology: "Typologie", current_score: "Impact actuel", target_score: "Ambition" }[field]}</span>
                          <Select value={row[field] === null ? "none" : String(row[field])} onValueChange={(v) => patch({ [field]: v === "none" ? null : Number(v) })}>
                            <SelectTrigger aria-label={`${axis.label} ${field}`} className="w-full min-w-0"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Non renseigné</SelectItem>
                              {[0, 1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                    <Textarea rows={2} maxLength={1500} value={row.evidence} onChange={(e) => patch({ evidence: e.target.value })} placeholder={axis.example} aria-label={`Observations ${axis.label}`} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" /> Précédent
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((current) => current + 1)}>
              Suivant <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={publish} disabled={busy}>
              {busy ? "Publication…" : "Publier ma fiche projet"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function PolishButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="mt-1 self-start" onClick={onClick} disabled={busy}>
      <Wand2 className="size-4" /> Améliorer avec l'assistant
    </Button>
  );
}
