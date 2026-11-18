import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Eye, Feather, Leaf, Sprout, Sun, Waves, Wind, CircleDashed as Yin } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tao")({
  head: () => ({
    meta: [
      { title: "Le Tao de projets.re — principes universels" },
      { name: "description", content: "Les principes universels de projets.re racontés comme un Tao : le vase vide, l'eau, la vallée ouverte, l'harmonie des contraires, la maturation, le tisserand invisible." },
      { property: "og:title", content: "Le Tao de projets.re" },
      { property: "og:description", content: "Un territoire qui s'organise par la visibilité, l'alignement spontané et le mouvement sans effort." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaoPage,
});

const PRINCIPLES = [
  { n: "I", icon: Feather, name: "Wu", title: "Le vase vide", quote: "Façonne l'argile en vase : c'est le vide intérieur qui le rend utile.", ch: "Ch. 11",
    points: ["Déposé une fois, fidèle à lui-même : le projet reste un bloc brut, vrai.", "Un réceptacle ouvert où besoins, budgets, jalons et impacts se cristallisent.", "Les appels à projets viennent lire la fiche ; le porteur ne trahit jamais sa voix."] },
  { n: "II", icon: Droplets, name: "Shui · Wu Wei", title: "L'eau et la stigmergie", quote: "Le bien suprême est comme l'eau : elle profite à tous sans rivaliser.", ch: "Ch. 8",
    points: ["Les projets ne se concurrencent pas : ils laissent des traces visibles.", "Comme des ruisseaux voisins, ils se rejoignent par proximité de thème, de lieu, de stade.", "Agir sans forcer : la plateforme abaisse les frictions, le lien devient le chemin naturel."] },
  { n: "III", icon: Eye, name: "Holoptisme", title: "La vallée ouverte", quote: "Donner naissance et nourrir, porter sans posséder, guider sans diriger.", ch: "Ch. 10",
    points: ["Chacun perçoit l'état du tout, d'un seul regard.", "Budgets, dons, subventions, jalons et livrables sous le soleil de l'île.", "Quand tout est visible, la méfiance se dissout."] },
  { n: "IV", icon: Yin, name: "Yin · Yang", title: "L'harmonie des contraires", quote: "Le difficile et le facile se complètent ; le haut et le bas reposent l'un sur l'autre.", ch: "Ch. 2",
    points: ["L'élan citoyen rencontre l'échelle institutionnelle.", "La science et la technique donnent l'os ; la solidarité et la culture, le sang.", "Enraciné dans l'île, réplicable dans tout l'archipel et au-delà."] },
  { n: "V", icon: Sprout, name: "Ziran", title: "Mûrir sans forcer", quote: "As-tu la patience d'attendre que la boue se dépose et que l'eau s'éclaircisse ?", ch: "Ch. 15",
    points: ["Avant de demander de l'argent, l'idée se pose des questions.", "L'IA et l'intelligence collective jardinent : elles taillent le flou, révèlent les angles morts.", "Le radar d'impact est un miroir, pas un examen : il montre où le vide invite à grandir."] },
  { n: "VI", icon: Leaf, name: "Le tisserand", title: "Le guide invisible", quote: "Quand l'œuvre est accomplie, les gens disent : nous l'avons fait nous-mêmes.", ch: "Ch. 17",
    points: ["Ne possède aucune propriété intellectuelle.", "Ne prélève aucune rente sur les communs.", "Un humus fertile : les projets poussent, fructifient et rendent leurs graines au sol."] },
];

function TaoPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
          <Yin className="size-[520px]" strokeWidth={0.6} />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <div className="mb-8 flex justify-center gap-6 text-muted-foreground">
            <Sun className="size-5" strokeWidth={1.25} /><Waves className="size-5" strokeWidth={1.25} /><Wind className="size-5" strokeWidth={1.25} /><Leaf className="size-5" strokeWidth={1.25} />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Principes universels</p>
          <h1 className="mt-4 font-display text-5xl leading-tight md:text-7xl">Le Tao de projets.re</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Le maître ne construit pas le monde par décret. Il façonne le vase, dégage le lit de la rivière, et laisse la vie s'organiser selon sa nature.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            projets.re traduit cette sagesse en architecture civique : un écosystème ouvert où l'ordre naît de la visibilité, de l'alignement spontané et du mouvement sans effort.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <ol className="space-y-24">
          {PRINCIPLES.map((p, i) => (
            <li key={p.n} className={`grid items-center gap-10 md:grid-cols-[220px_1fr] ${i % 2 ? "md:[&>*:first-child]:order-2 md:grid-cols-[1fr_220px]" : ""}`}>
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-36 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                  <p.icon className="size-14 text-primary" strokeWidth={1} />
                </div>
                <span className="font-display text-3xl text-muted-foreground">{p.n}</span>
                <span className="text-xs uppercase tracking-[0.25em] text-accent-foreground">{p.name}</span>
              </div>
              <div>
                <h2 className="font-display text-3xl md:text-4xl">{p.title}</h2>
                <blockquote className="mt-4 border-l-2 border-primary pl-4 italic text-muted-foreground">
                  « {p.quote} » <span className="not-italic text-xs">— Tao Te King, {p.ch}</span>
                </blockquote>
                <ul className="mt-6 space-y-3">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /><span>{pt}</span></li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <Waves className="mx-auto size-8 text-primary" strokeWidth={1.25} />
          <p className="mt-6 font-display text-3xl leading-snug md:text-4xl">« Le meilleur guide est celui dont on sait à peine qu'il existe. »</p>
          <p className="mt-6 text-muted-foreground">Déposez une idée, rejoignez un projet, ou ouvrez la voie sur votre territoire.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/deposer">Déposer mon projet</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/trouver">Trouver mon projet</Link></Button>
            <Button asChild size="lg" variant="ghost"><Link to="/territoire">Le territoire</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
