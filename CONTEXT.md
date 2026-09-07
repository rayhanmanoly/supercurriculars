# BSAK Supercurriculars — Project Context

## Active branch
`explore/full-mvp` — all full-feature pages enabled, connected to a new Supabase project.

## Public-readiness (in progress)
- Supabase starter dead code removed: `Header`, `DeployButton`, `NextLogo`, `SupabaseLogo`, `components/tutorial/*`
- Legacy duplicate `components/Sidebar.tsx` removed; pages rely on `AppSidebar` via `client-layout`
- `SafeImage` component added for graceful fallback when Supabase storage URLs 404
- Debug `console.log` calls gated via `lib/debug.ts` (`debugLog`, dev-only)
- Removed Calendly code (`components/calendly.tsx`, `/schedule/[mentorId]`) and dead imports
- Flattened `early_version` flag in `app-sidebar` (always full nav)
- Subject ambassadors: teachers grant/revoke `can_add` via `AmbassadorsManager` + RPCs in `003_ambassador_rpcs.sql` (run on Supabase)
- Middleware tutorial try/catch removed; manage-resources now SWR shell → hook → content
- Demo catalogue seed: `004_seed_demo_catalogue.sql` (16 opportunities + 4 events) with images in `public/img/seed/`
- Portfolio cards + detail sheet use same centered `SafeImage` layout as resource hub (`OpportunityCard`)
- Standalone bootstrap: `supabase/init.sql` (schema + `profile_tokens` + privilege trigger + ambassador RPCs + demo seed). Prefer this over numbered migrations for fresh installs. Exclude `002_restore_data.sql` from public packaging.
- Onboarding: temporary Student/Teacher toggle (replaces BSAK email-digit heuristic) sets `role` on profile create
- Draft public README written (features, setup, roles, stack); screenshots linked from `docs/screenshots/`
- `docs/DATA_MODEL.md` scrubbed for public copy (no backup provenance; points at `init.sql`)

## Status (Jun 2026)
Restore in progress. The branch is code-complete and awaiting a new Supabase project to be wired in.

| Step | Status |
|------|--------|
| Branch created with all features | ✅ Done |
| Page version audit + auth redirect fix | ✅ Done |
| `.gitignore` + `.env.example` | ✅ Done |
| Migration SQL extracted | ✅ Done (`supabase/migrations/`) |
| Dev fixes (mobile bypass, auth-code-error) | ✅ Done |
| New Supabase project created | ⏳ Needs manual action |
| Migrations run via psql | ⏳ Awaiting project creation |
| Storage files uploaded | ⏳ Awaiting project creation |
| `.env.local` updated with new keys | ⏳ Awaiting project creation |
| Smoke test (`npm run dev`) | ⏳ Awaiting env wiring |

## Module status

All data-fetching pages now follow the SWR pattern: thin `page.tsx` shell → `useXxxData` SWR hook → `XxxContent` component.

| Route | Shell | Hook | Content | Pattern |
|-------|-------|------|---------|---------|
| `/dashboard` | `page.tsx` | `useDashboardData.tsx` | `DashboardContent.tsx` | SWR ✅ |
| `/resources` | `page.tsx` | `useResourceData.tsx` | `ResourceContent.tsx` | SWR ✅ |
| `/portfolio` | `page.tsx` | `usePortfolioData.tsx` | `PortfolioContent.tsx` | SWR ✅ |
| `/events` | `page.tsx` | `useEventsData.tsx` | `EventsContent.tsx` | SWR ✅ |
| `/mentoring` | `page.tsx` | (context only) | inline | Context ✅ |
| `/mentoring/[subject]` | `page.tsx` | `useMentoringSubjectData.tsx` | `MentoringSubjectContent.tsx` | SWR ✅ |
| `/my-mentoring` | `page.tsx` | `useMyMentoringData.tsx` | `MyMentoringContent.tsx` | SWR ✅ |
| `/settings` | `page.tsx` | `useSettingsData.tsx` | `SettingsContent.tsx` | Context ✅ |
| `/manage-resources` | `page.tsx` | `useManageResourcesData.tsx` | `ManageResourcesContent.tsx` | SWR ✅ |
| `/manage-resources/add-activity` | → `AddActivityForm.tsx` | — | Full — Fuse dedup, ActivityPreview | Legacy |
| `/login` | `app/login/page.tsx` | — | Google OAuth only | — |

## Global contexts (client-layout.tsx)
- `ProfileContext` — user profile (fetched once at layout)
- `TeacherContext` — teacher list
- `IsMentorContext` — boolean mentor status

## Security fixes applied (Jun 2026)

Included in `supabase/init.sql` for fresh installs:

1. **Privilege escalation (profiles):** `BEFORE UPDATE` trigger `prevent_privilege_escalation` blocks authenticated clients from modifying `role`, `can_add`, or `can_add_approver` (ambassador RPCs bypass via SECURITY DEFINER).
2. **OAuth token exposure:** tokens live in `profile_tokens` with own-row-only RLS. App code in `lib/actions.ts` / `lib/event_actions.ts` reads/writes that table.

## Key files

- `lib/actions.ts` — all Supabase server actions (auth, opportunities, portfolio, events, mentoring); includes `updateProfile` for settings saves
- `lib/event_actions.ts` — mentoring event CRUD (group sessions, appointments)
- `lib/types.ts` — TypeScript interfaces (source of truth for data shapes)
- `components/app-sidebar.tsx` — navigation (full feature set)
- `utils/supabase/` — `client.ts`, `server.ts`, `middleware.ts` using `@supabase/ssr`

## What needs re-auth on first login
- Google Calendar integration (expired provider tokens) — refreshed automatically via `updateGoogleTokens()` on login

## 1:1 mentor booking
- **Active (Phase 1):** `Open Booking Page` button on `/mentoring/[subject]` opens the mentor's `google_appointment_link` (Google Appointment Schedules) in a new tab. Iframe embed was abandoned because Google enforces `X-Frame-Options: SAMEORIGIN` on `calendar.app.google` and the sign-in redirect, which cannot be overridden from our origin.
- **Phase 2 (queued):** native in-app booking on top of Google Calendar API (`freebusy.query` + `events.insert`) using existing `provider_token` / `calendar` scope. Will replace `MentoringSetup` wizard with an availability editor and deprecate `mentors.google_appointment_link`. Iframe component is preserved as a commented reference in `app/mentoring/[subject]/MentoringSubjectContent.tsx`.

## Deferred / out of scope for exploratory branch
- Phase 2 native in-app booking (see above)
- Production deployment / Vercel env vars
- Clean git history before public GitHub push
