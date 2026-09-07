# Data Model

Schema reference for this app. Source of truth for fresh installs: `supabase/init.sql` (tables, RLS, storage buckets, ambassador RPCs, demo seed).

---

## Public Tables

### `profiles`
Extends `auth.users` 1-to-1 via `id → auth.users(id)`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | FK → `auth.users.id` (CASCADE) |
| `created_at` | timestamptz | |
| `first_name` | text | |
| `last_name` | text | |
| `email` | text | |
| `role` | text | `'student'` or `'teacher'` |
| `current_year` | numeric | School year group (7–13) |
| `subjects` | text[] | Student's A-level subjects |
| `can_add` | boolean | Teacher-granted permission to add resources |
| `can_add_approver` | uuid | FK → `profiles.id` (the teacher who granted `can_add`) |
| `profile_url` | text | Google profile picture URL |

Teachers grant/revoke via RPCs `grant_can_add(uuid)` / `revoke_can_add(uuid)` because profiles UPDATE RLS is own-row-only and a `BEFORE UPDATE` trigger (`prevent_privilege_escalation`) blocks client changes to `role` / `can_add` / `can_add_approver`.

RLS: `SELECT` for all authenticated; `INSERT`/`UPDATE` own row only.

### `profile_tokens`
Own-row Google OAuth tokens (kept off `profiles` so authenticated `SELECT *` on profiles cannot leak tokens).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | FK → `profiles.id` (CASCADE) |
| `provider_token` | text | Google access token |
| `provider_refresh_token` | text | Google refresh token |
| `updated_at` | timestamptz | Maintained by trigger |

RLS: all operations own-row only (`auth.uid() = id`).

---

### `opportunities`
The central resource catalogue.

| Column | Type | Notes |
|--------|------|-------|
| `opportunity_id` | uuid PK | `gen_random_uuid()` |
| `title` | text | |
| `short_description` | text | 1–2 sentences |
| `full_description` | text | |
| `url` | text | External link |
| `image` | text | Storage URL |
| `past_projects` | text[] | Array of Storage URLs for example submissions |
| `opportunity_type` | text | e.g. Competition, Course, Internship |
| `subjects` | text[] | Relevant subjects |
| `year_groups` | numeric[] | Applicable year groups |
| `internal` | boolean | School-run vs external |
| `online` | boolean | |
| `one_off` | boolean | Single-event vs ongoing |
| `time_required` | numeric | 0–5 scale (few hours → months) |
| `cost` | numeric | GBP |
| `weightage` | numeric | Prestige/difficulty score 1–5 |
| `submission_date` | date | Deadline |
| `contact_name` | text | |
| `contact_email` | text | |
| `advice` | text | Tips for applicants |
| `status` | text | `'pending'` / `'active'` — teacher-reviewed |
| `review_teacher` | text | Email of responsible teacher |
| `review_text` | text | Teacher feedback |
| `submitted_by` | uuid | FK → `profiles.id` |
| `custom_opportunity` | boolean | Student-submitted custom activity |
| `created_at` / `last_updated` | timestamptz | |

RLS: `SELECT` for all authenticated; `INSERT` for authenticated; `UPDATE`/`DELETE` restricted to submitter or review teacher.

---

### `portfolios`
A student's record of engaging with an opportunity.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint IDENTITY PK | |
| `user_id` | uuid | FK → `auth.users.id` |
| `opportunity_id` | uuid | FK → `opportunities.opportunity_id` |
| `status` | text | `'In Progress'` / `'Completed'` |
| `description` | text | Reflection text |
| `project_files` | text[] | Storage URLs of uploaded evidence |
| `started_at` | timestamptz | |
| `finished_at` | timestamptz | |

RLS: all operations restricted to own `user_id`.

---

### `events`
School events students can register for.

| Column | Type | Notes |
|--------|------|-------|
| `event_id` | bigint IDENTITY PK | |
| `title` | text | |
| `category` | text | e.g. Talk, House Competition |
| `sub_category` | text | One-word descriptor |
| `date` | date | |
| `start_time` / `end_time` | timetz | |
| `poster` | text | Storage URL |
| `description` | text | |
| `contact_name` / `contact_email` | text | |
| `year_groups` | numeric[] | Applicable year groups |
| `google_event_id` | text | Google Calendar event ID |
| `invite_link` | text | Google Calendar invite URL |

RLS: `SELECT` for all authenticated (no write via app).

---

### `user_events`
Junction: which students are attending which events.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid PK (composite) | FK → `profiles.id` |
| `event_id` | bigint PK (composite) | FK → `events.event_id` |
| `google_event_id` | text | User's copy of the Google Calendar event |

RLS: `SELECT`/`INSERT`/`DELETE` own `user_id` only.

---

### `mentors`
Students or teachers who offer mentoring sessions.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid PK | FK → `auth.users.id` AND `profiles.id` |
| `email` | text | |
| `description` | text | Bio shown on mentoring browse |
| `availability_text` | text | Free-text schedule description |
| `google_appointment_link` | text | Google Appointment Slots URL for 1:1 booking |
| `mentoring_subjects` | text[] | Subjects they mentor in |

RLS: `SELECT` for all authenticated; `UPDATE` for authenticated.

---

### `group_mentoring_events`
Group sessions created by mentors.

| Column | Type | Notes |
|--------|------|-------|
| `group_session_id` | bigint IDENTITY PK | |
| `mentor_id` | uuid | FK → `mentors.user_id` AND `profiles.id` |
| `title` | text | |
| `description` | text | |
| `subjects` | text[] | |
| `applicable_year_groups` | numeric[] | |
| `date` | date | |
| `start_time` / `end_time` | timetz | |
| `location` | text | Room/venue |
| `google_event_id` | text | |
| `invite_link` | text | |
| `iCalUID` | text | |

RLS: `SELECT` for all authenticated; `INSERT`/`UPDATE` for authenticated.

---

### `appointments`
Records of students booking 1:1 or group mentoring sessions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint IDENTITY PK | |
| `user_id` | uuid | FK → `profiles.id` |
| `mentor_id` | uuid | FK → `mentors.user_id` |
| `group_session_id` | bigint | FK → `group_mentoring_events.group_session_id` (null for 1:1) |
| `status` | text | Booking status |
| `user_priority_subject` | text | Subject context for display |
| `google_event_id` | text | Mentor's calendar event |
| `local_event_id` | text | User's copy of the calendar event |

RLS: `SELECT`/`INSERT`/`DELETE` for all authenticated.

---

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `opportunities` | Yes | Opportunity thumbnail images and past project PDFs |
| `portfolio` | Yes | Student evidence files (per-user folder: `{user_id}/{...}`) |
| `events` | Yes | Event poster images |

Demo catalogue images use site-relative paths under `/img/seed/` (Next.js `public/`).
User uploads (`image`, `past_projects`, `project_files`) use Supabase Storage public URLs
in the `opportunities`, `events`, and `portfolio` buckets.

---

## Auth

- All users authenticate via Google OAuth (no email/password).
- `auth.users` UUIDs are the primary key that ties everything together.
- `profiles` is created on first login via the onboarding flow (`/login/onboarding`).
- Google OAuth tokens for Calendar live in `profile_tokens` and are refreshed via
  `updateGoogleTokens()` / `refreshToken()` in `lib/actions.ts`.
