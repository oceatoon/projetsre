<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep impact diagnostics and measurable objectives separate from the project’s existing impact indicators; only project owners edit them, and objective links must stay within the same project to preserve evidence integrity.
- Collaboration posture (project_reciprocity) and cooperation charters (cooperation_charters) live in their own tables; scoring rules are in src/lib/reciprocity.ts so UI and tests share one definition.
- Localize presentation text through the shared language context and static catalogs; preserve original records, identifiers and scoring inputs so changing language never changes project data or evidence.
- Partner portals are a branded filter over shared projects (config in src/lib/partners.ts), never separate copies of project data, so one fiche serves every cofunder.
