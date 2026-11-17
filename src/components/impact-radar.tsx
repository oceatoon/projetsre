import { IMPACT_AXES, type AxisRating } from "@/lib/impact";

const point = (index: number, radius: number) => {
  const angle = (index * Math.PI) / 4 - Math.PI / 2;
  return [200 + Math.cos(angle) * radius, 190 + Math.sin(angle) * radius];
};
export function ImpactRadar({ ratings }: { ratings: AxisRating[] }) {
  const polygon = (field: "typology" | "current_score" | "target_score") => IMPACT_AXES.map((a, i) => point(i, ((ratings.find((r) => r.axis === a.key)?.[field] ?? 0) / 5) * 120).join(",")).join(" ");
  const assessed = ratings.some((a) => a.current_score !== null || a.typology !== null || a.target_score !== null);
  return <figure className="min-w-0">
    <svg viewBox="0 0 400 380" role="img" aria-label="Diagnostic radial : typologie, impact actuel et ambition sur huit thèmes" className="mx-auto w-full max-w-lg">
      <title>Diagnostic d’impact du projet</title>
      <desc>{ratings.map((r) => `${IMPACT_AXES.find((a) => a.key === r.axis)?.label} : typologie ${r.typology ?? "non renseignée"}, impact ${r.current_score ?? "non renseigné"}, ambition ${r.target_score ?? "non renseignée"}`).join(". ")}</desc>
      {[1, 2, 3, 4, 5].map((level) => <polygon key={level} points={IMPACT_AXES.map((_, i) => point(i, level * 24).join(",")).join(" ")} className="fill-none stroke-border" />)}
      {IMPACT_AXES.map((a, i) => { const [x, y] = point(i, 120); const [lx, ly] = point(i, 157); return <g key={a.key}><line x1="200" y1="190" x2={x} y2={y} className="stroke-border" /><text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-[12px] font-medium">{a.label}</text></g>; })}
      {[1, 3, 5].map((n) => <text key={n} x="205" y={190 - n * 24 + 4} className="fill-muted-foreground text-[10px]">{n}</text>)}
      {assessed && <><polygon points={polygon("typology")} className="fill-chart-4/10 stroke-chart-4" strokeWidth="2" strokeDasharray="3 4" /><polygon points={polygon("target_score")} className="fill-none stroke-primary" strokeWidth="2" strokeDasharray="7 4" /><polygon points={polygon("current_score")} className="fill-lagoon/20 stroke-lagoon" strokeWidth="2.5" /></>}
      {!assessed && <text x="200" y="208" textAnchor="middle" className="fill-muted-foreground text-[12px]">À diagnostiquer</text>}
    </svg>
    <figcaption className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
      <span className="flex items-center gap-2"><span className="w-6 border-t-2 border-dotted border-chart-4" />Typologie</span>
      <span className="flex items-center gap-2"><span className="w-6 border-t-2 border-lagoon" />Impact actuel</span>
      <span className="flex items-center gap-2"><span className="w-6 border-t-2 border-dashed border-primary" />Ambition</span>
    </figcaption>
  </figure>;
}