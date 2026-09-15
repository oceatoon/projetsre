import { euro, frDate, needLabel, sectionLabel, stageLabel, statusLabel, themeLabel } from "./domain";
import type { Call, ProjectDetail } from "./types";

function esc(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function list(items: string[]) {
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function block(title: string, body: string) {
  return `<section><h2>${esc(title)}</h2>${body}</section>`;
}

export function sectionHtml(section: string, detail: ProjectDetail): string {
  const { project } = detail;
  switch (section) {
    case "presentation":
      return block(
        sectionLabel(section),
        paragraphs(project.description) +
          `<h3>Valeur ajoutée</h3>${paragraphs(project.value_added)}`,
      );
    case "besoins":
      return block(sectionLabel(section), paragraphs(project.needs_answered));
    case "objectifs":
      return block(sectionLabel(section), list(project.objectives));
    case "jalons":
      return block(
        sectionLabel(section),
        `<table><thead><tr><th>Jalon</th><th>Échéance</th><th>Statut</th></tr></thead><tbody>${detail.milestones
          .map(
            (m) =>
              `<tr><td><strong>${esc(m.title)}</strong><br/>${esc(m.description)}</td><td>${esc(
                frDate(m.due_date),
              )}</td><td>${esc(statusLabel(m.status))}</td></tr>`,
          )
          .join("")}</tbody></table>` +
          (detail.actions.length
            ? `<h3>Actions réalisées</h3>${list(
                detail.actions.map((a) => `${a.title} — ${a.author_name}`),
              )}`
            : ""),
      );
    case "budget":
      return block(
        sectionLabel(section),
        `<p>Budget nécessaire : <strong>${esc(euro(project.budget_needed))}</strong> — déjà réuni : <strong>${esc(
          euro(project.budget_secured),
        )}</strong></p>` +
          (detail.funders.length
            ? `<h3>Cofinanceurs</h3>${list(
                detail.funders.map((f) => `${f.name} — ${euro(f.amount)}`),
              )}`
            : "") +
          (detail.expenses.length
            ? `<h3>Dépenses engagées</h3><table><thead><tr><th>Dépense</th><th>Catégorie</th><th>Montant</th></tr></thead><tbody>${detail.expenses
                .map(
                  (e) =>
                    `<tr><td>${esc(e.label)}</td><td>${esc(e.category)}</td><td>${esc(
                      euro(e.amount),
                    )}</td></tr>`,
                )
                .join("")}</tbody></table>`
            : ""),
      );
    case "impact":
      return block(
        sectionLabel(section),
        project.impact.length
          ? list(project.impact.map((i) => `${i.label} : ${i.value}`))
          : "<p>Indicateurs en cours de définition.</p>",
      );
    case "communaute":
      return block(
        sectionLabel(section),
        `<p>Communauté déclarée : ${project.community_size} personnes. ${detail.supports.length} soutien(s) enregistré(s) sur projets.re, ${detail.feedback.length} avis citoyen(s).</p>` +
          (detail.supports.length
            ? list(
                detail.supports.map(
                  (s) => `${s.supporter_name} — ${s.kind}${s.amount ? ` (${euro(s.amount)})` : ""}`,
                ),
              )
            : ""),
      );
    case "maturation":
      return block(
        sectionLabel(section),
        detail.questions.length
          ? detail.questions
              .map(
                (q) =>
                  `<h3>${esc(q.question)}</h3>${
                    q.answer ? paragraphs(q.answer) : "<p><em>Réponse à compléter.</em></p>"
                  }`,
              )
              .join("")
          : "<p>Aucune question de maturation enregistrée.</p>",
      );
    default:
      return "";
  }
}

export function buildDossier(options: {
  detail: ProjectDetail;
  sections: string[];
  call?: Call | null;
  answers?: { question: string; answer: string }[];
}) {
  const { detail, sections, call, answers } = options;
  const { project } = detail;
  const head = `
    <header>
      <p class="kicker">projets.re — dossier de projet${call ? ` · réponse à un appel à projets` : ""}</p>
      <h1>${esc(project.name)}</h1>
      <p class="tagline">${esc(project.tagline)}</p>
      <p class="meta">${esc(project.carrier_name)} · ${esc(project.commune)} · ${esc(
        themeLabel(project.theme),
      )} · ${esc(stageLabel(project.stage))}</p>
      <p class="meta">Besoins : ${esc(project.need_types.map(needLabel).join(", "))}</p>
      ${
        call
          ? `<div class="callbox"><strong>${esc(call.title)}</strong><br/>${esc(
              call.institution,
            )} · dépôt jusqu'au ${esc(frDate(call.deadline))}</div>`
          : ""
      }
    </header>`;

  const answerBlock =
    answers && answers.length
      ? block(
          "Réponses aux questions de l'appel",
          answers
            .map((a) => `<h3>${esc(a.question)}</h3>${paragraphs(a.answer || "À compléter.")}`)
            .join(""),
        )
      : "";

  const body = sections.map((section) => sectionHtml(section, detail)).join("");

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
  <title>${esc(project.name)} — dossier projets.re</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: Georgia, "Times New Roman", serif; color: #1b1a18; line-height: 1.55; }
    header { border-bottom: 2px solid #c2410c; padding-bottom: 12px; margin-bottom: 24px; }
    .kicker { text-transform: uppercase; letter-spacing: .12em; font-size: 10px; color: #c2410c; margin: 0; }
    h1 { font-size: 30px; margin: 8px 0 4px; }
    .tagline { font-size: 15px; margin: 0 0 8px; }
    .meta { font-size: 12px; color: #57534e; margin: 2px 0; }
    .callbox { margin-top: 12px; padding: 10px 12px; background: #f5f5f4; font-size: 12px; }
    section { margin-bottom: 22px; page-break-inside: avoid; }
    h2 { font-size: 17px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; }
    h3 { font-size: 13px; margin-bottom: 2px; }
    p, li, td, th { font-size: 12.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #e7e5e4; padding: 6px 8px; text-align: left; vertical-align: top; }
    footer { margin-top: 28px; border-top: 1px solid #e7e5e4; padding-top: 8px; font-size: 10px; color: #78716c; }
  </style></head><body>
  ${head}${answerBlock}${body}
  <footer>Dossier généré depuis projets.re — plateforme des projets du territoire de La Réunion.</footer>
  </body></html>`;
}

export function printHtml(html: string) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
}
