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
- Account listing and role assignment use national-admin-only database RPCs; role triggers protect self/last-admin removal and audit changes. Why: privileged account data and access changes must remain secure on both managed and self-hosted deployments without service keys.
- Public-site nav/footer config is in `src/data/site.ts`; sample content in `src/data/content.ts`. Why: single editable source for menus.

- Public pages load published database content through shared query options and a public server-function client; never use illustrative arrays for published content. Why: admin edits must be visible publicly under RLS.
- Public content and public submission handlers create their client through the shared server-only factory; explicit runtime configuration takes precedence, with build-time public configuration used only when absent. Why: self-hosted deployments need consistent configuration without bypassing RLS or silently switching databases on invalid input.
- Self-hosted Docker builds use Nitro node-server; Lovable retains its managed runtime. Why: Coolify needs a standalone HTTP process with static asset serving.
- Available imported media is stored in asset pointers, checked for valid binary content, and materialized to public paths for self-hosted builds. Why: exports must serve available media locally and must not treat anti-bot HTML as images.
- Portalul intern (/portal) este pentru membri aprobați și staff; accesul se decide doar în baza de date prin funcția portal_access(user_id) și politicile RLS ale tabelelor portal_*, internal_events, forum_*, branch_messages. Why: apartenența la partid este dată sensibilă, verificarea în UI nu e suficientă.
- The branch map uses bundled, simplified geoBoundaries county geometry rendered as SVG, with database branch availability driving selection. Why: accurate boundaries work on every hosting without map credentials or geolocation.
- Password recovery returns to the public `/reset-password` route and updates the password only in a recovery session, without requesting the old password. Why: emailed recovery links must work without an authenticated-route redirect.
- Password recovery and signup confirmation use shared canonical destinations and an early, fixed-origin, action-specific relay in the document head. Why: managed Auth may fall back to its Site URL for self-hosted deployments; credentials must reach the intended public recovery or sign-in page before the auth client loads.
- Portal membership cards use a caller-scoped database RPC projecting only membership and current-year dues; portal branch visibility and moderation transitions are enforced in database policies and triggers. Why: political membership and branch conversations require narrow disclosure without broad member-table reads.
- CRM bulk changes use an allowlisted, transactional, security-invoker database RPC with RLS and auditing. Why: partial or unauthorized batch updates must roll back rather than silently succeed.
- Public donation progress uses an aggregate-only database RPC over confirmed live RON payments since an administrator-configured campaign date. Why: donor identities, test payments, invented targets and impact claims must never enter public campaign metrics.
- Public contact deduplication is insert-only on email conflicts, and newsletter tokens are issued only server-side without resetting confirmed subscriptions. Why: anonymous forms must not overwrite existing identities or disclose confirmation credentials.
- Signup assigns only the baseline role; administrators are assigned explicitly through the protected access flow. Why: an empty administrator list must never turn public signup into an administrator claim.
- Encode untrusted email text and neutralize formula-leading CSV cells through shared output helpers. Why: user-supplied names must remain text in receipts, confirmations and staff spreadsheets.
- Resend callbacks verify raw-body Svix signatures with the server-only RESEND_WEBHOOK_SECRET before privileged writes and fail closed when absent. Why: only authentic provider events may update deliveries or suppress known recipients.
- Donation checkout requires authenticated, nationally verified account-to-CNP binding before cap queries; verification is managed through the protected access screen. Why: email confirmation alone cannot prove ownership of a supplied national identifier.
- Public branch data comes from a narrow projection RPC while raw rows stay staff-only; public media reads require published-content references. Why: public maps and published assets must not expose internal contacts or unpublished documents.
- Test-email recipients derive exclusively from the server-validated, confirmed account email. Why: caller-supplied addresses must not redirect test delivery.
