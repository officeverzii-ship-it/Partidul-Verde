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

- Admin panel lives under `src/routes/_authenticated/admin*`, using the browser client with RLS as the security boundary; UI role gating in `src/lib/roles.ts` is cosmetic only. Why: permissions enforced in the database via `has_role`/`user_branch`.
- Public-site nav/footer config is in `src/data/site.ts`; sample content in `src/data/content.ts`. Why: single editable source for menus.

- Public pages load published database content through shared query options and a public server-function client; never use illustrative arrays for published content. Why: admin edits must be visible publicly under RLS.
- Public content and public submission handlers create their client through the shared server-only factory; explicit runtime configuration takes precedence, with build-time public configuration used only when absent. Why: self-hosted deployments need consistent configuration without bypassing RLS or silently switching databases on invalid input.
- Self-hosted Docker builds use Nitro node-server; Lovable retains its managed runtime. Why: Coolify needs a standalone HTTP process with static asset serving.
- Available imported media is stored in asset pointers, checked for valid binary content, and materialized to public paths for self-hosted builds. Why: exports must serve available media locally and must not treat anti-bot HTML as images.
- Portalul intern (/portal) este pentru membri aprobați și staff; accesul se decide doar în baza de date prin funcția portal_access(user_id) și politicile RLS ale tabelelor portal_*, internal_events, forum_*, branch_messages. Why: apartenența la partid este dată sensibilă, verificarea în UI nu e suficientă.
- The branch map uses bundled, simplified geoBoundaries county geometry rendered as SVG, with database branch availability driving selection. Why: accurate boundaries work on every hosting without map credentials or geolocation.
- Password recovery returns to the public `/reset-password` route and updates the password only in a recovery session, without requesting the old password. Why: emailed recovery links must work without an authenticated-route redirect.
- Password recovery uses a shared canonical destination and an early, fixed-origin recovery-only relay in the document head. Why: managed Auth may fall back to its Site URL for self-hosted deployments; recovery credentials must reach the intended host before the auth client loads.
