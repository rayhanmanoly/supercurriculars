# Supercurricular & Mentoring Platform

School-facing web app for discovering supercurricular opportunities, building a student portfolio, booking peer mentoring, and managing school events.

Designed to help support students' out-of-lesson learning in upper secondary years, whilst simultaneously making the student-teacher link during university application season more seamless.

Originally designed for use at the British School Al Khubairat (BSAK). **This repository is a public facing version of a platform I developed in 2024.** It is not an official BSAK product. The BSAK name and logo are trademarks of their respective owners; no affiliation or endorsement is implied.

---



## Features


| Area                     | What it does                                                                                                                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource Hub**         | Browse curated opportunities (competitions, courses, projects, etc.) with filters by subject, year group, time, cost, rating, and more. Add items to your portfolio. Features a rudimentary recommendation system to surface relevant opportunities. |
| **Portfolio**            | Track activities In Progress / Completed, attach reflections and files, edit completed work, export a PDF. (TODO - make accessible to teachers).                                                                                                     |
| **Events**               | Browse upcoming school events and add to your schedule; syncs with Google Calendar.                                                                                                                                                                  |
| **Mentoring**            | Browse mentors by subject; book 1:1 via the mentor’s Google Appointment Schedule link; join group mentoring sessions. Mentors manage their profile and sessions under **My Mentoring**.                                                              |
| **Manage Resources**     | Submit new opportunities (students with contributor access or teachers). Teachers review pending submissions and manage "**subject ambassadors**".                                                                                                   |
| **Settings / Dashboard** | Profile details, role display, and a home overview of activity.                                                                                                                                                                                      |


Demo catalogue data (16 opportunities + 4 events) ships with `supabase/init.sql`. Images for the seed live under `public/img/seed/` and are referenced as site-relative paths (no Storage upload required for the seed).

---



## Screenshots



### Dashboard



### Resource Hub


| Catalogue | Opportunity detail |
| --------- | ------------------ |
|           |                    |




### Portfolio


| Activities | Activity detail |
| ---------- | --------------- |
|            |                 |




### Events


| Event list | Event detail |
| ---------- | ------------ |
|            |              |




### Mentoring


| Subject picker | Browse mentors | Mentor profile |
| -------------- | -------------- | -------------- |
|                |                |                |



| My Mentoring (mentor tools) |
| --------------------------- |
|                             |




### Manage Resources



---



## Tech stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **UI:** Tailwind CSS, Radix UI / shadcn-style components, Lucide icons
- **Data:** Supabase (Postgres, Auth, Storage), `@supabase/ssr` cookie sessions
- **Client fetching:** SWR (most pages: thin `page.tsx` → `useXxxData` → `XxxContent`)
- **Auth:** Google OAuth (Supabase Auth) with Calendar scope for mentoring / event sync
- **Other:** Zod + React Hook Form, Fuse.js (activity dedup), jsPDF (portfolio export)

Key server logic lives in `lib/actions.ts` and `lib/event_actions.ts`. Schema notes: `docs/DATA_MODEL.md`.

---



## Access roles

Roles are stored on `profiles.role` and set at **first onboarding** (Student / Teacher toggle — temporary for demo installs; production originally used school email heuristics).


| Role / flag | Who                                                | Capabilities                                                                                                          |
| ----------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Student** | Default                                            | Resource Hub, Portfolio, Events, Mentoring, Settings. Cannot review submissions.                                      |
| **Teacher** | Chosen at onboarding (or set in SQL)               | Everything students can do, plus review/approve opportunities, manage subject ambassadors, appear as review contacts. |
| `can_add`   | Teacher-granted via Manage Resources → Ambassadors | Student may submit new opportunities for review. Stored as `profiles.can_add` / `can_add_approver`.                   |
| **Mentor**  | Row in `mentors`                                   | Sees **My Mentoring**; offers 1:1 booking link + group sessions. Independent of teacher/student.                      |


**Security notes (enforced in DB):**

- Clients cannot escalate `role` / `can_add` / `can_add_approver` via normal profile updates (`prevent_privilege_escalation` trigger).
- Teachers grant/revoke ambassadors through `grant_can_add` / `revoke_can_add` RPCs.
- Google OAuth tokens live in `profile_tokens` (own-row RLS), not on `profiles`.

---



## Setup



### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google Cloud OAuth client (Web) with Calendar API enabled, wired into Supabase Auth → Google provider



### 1. Clone and install

```bash
git clone <this-repo>
cd <repo>
npm install
cp .env.example .env.local
```



### 2. Environment

Fill `.env.local`:


| Variable                        | Where                                               |
| ------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same                                                |
| `GOOGLE_CLIENT_ID`              | Google Cloud → Credentials (used for token refresh) |
| `GOOGLE_CLIENT_SECRET`          | same                                                |




### 3. Database

Run the standalone bootstrap (schema, RLS, storage buckets, ambassador RPCs, demo seed):

- Supabase SQL Editor: paste / run `supabase/init.sql`, **or**
- `psql` with the Session-mode connection string (port `5432`):

```bash
psql "postgres://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
  -f supabase/init.sql
```

Do **not** use legacy `supabase/migrations/002_restore_data.sql` (contains real PII / tokens). Prefer `init.sql` over the older numbered migrations for fresh installs.

### 4. Auth redirect URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL:** e.g. `http://localhost:3000` (or whatever port you use)
- **Redirect URLs:** `http://localhost:<port>/auth/callback` (match your port exactly)

Google Cloud OAuth authorized redirect URI should be the Supabase callback  
`https://<project-ref>.supabase.co/auth/v1/callback`.

Request scopes include Google Calendar (`signInWithOAuth` in the login button).

### 5. Run

```bash
npm run dev
```

Open the app → **Login with Google** → complete onboarding (pick **Student** or **Teacher**) → land on `/dashboard`.

Storage buckets `portfolio`, `opportunities`, and `events` are created by `init.sql` for user uploads. Seed images do not need uploading.

---



## App routes (overview)


| Route                                | Purpose                                               |
| ------------------------------------ | ----------------------------------------------------- |
| `/login`                             | Google sign-in                                        |
| `/login/onboarding`                  | First-time profile (role + subjects / year)           |
| `/dashboard`                         | Home                                                  |
| `/resources`                         | Opportunity catalogue                                 |
| `/portfolio`                         | Personal activity tracker + PDF export                |
| `/events`                            | School events                                         |
| `/mentoring`, `/mentoring/[subject]` | Find mentors / sessions                               |
| `/my-mentoring`                      | Mentor tools (if mentor)                              |
| `/manage-resources`                  | Submit / review opportunities; ambassadors (teachers) |
| `/settings`                          | Profile                                               |


Auth callback: `/auth/callback` — new users (no `profiles` row) → onboarding; returning users → `/dashboard`.

---



## Project layout (high level)

```
app/                 # Next.js App Router pages
components/          # UI + domain components (sidebar, cards, forms)
lib/                 # Server actions, types, globals, debug
utils/supabase/      # Browser / server / middleware clients
supabase/init.sql    # Full DB bootstrap + demo seed
public/img/          # Static assets (incl. seed logos)
docs/DATA_MODEL.md   # Table / RLS summary
```

---



## Known limitations / future work

- 1:1 mentoring uses **Google Appointment Schedules** (external link), not in-app free/busy booking.
- Onboarding Student/Teacher toggle is intentional for demos; lock this down for real school deployments.
- Some UI strings still reference school admin emails from the original deployment context.
- Portfolio PDF and Calendar features need valid Google tokens (`profile_tokens`).
- Admin portal and full-fledged teacher portals are a WiP.

---



## License & branding

All rights reserved unless otherwise noted. Provided for portfolio demonstration.

Organisation logos under `public/img/seed/` belong to their respective owners and are included only for non-commercial demo display.

BSAK name/logo: property of the British School Al Khubairat / associated entities — used here only to show the original design context.