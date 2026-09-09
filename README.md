# Med64 — Secure Supabase Login Version

This package converts the browser-only login into real Supabase Authentication and moves users, questions, progress, and mistakes into Supabase/Postgres.

## What this version does

- Student login uses a simple **User ID + Password**.
- Passwords are handled by Supabase Auth; they are not stored in `index.html`.
- Admin can create student accounts from the website.
- Admin can activate/deactivate students, reset student passwords, and delete students.
- Students and admins have separate roles.
- Question bank is stored centrally in Supabase.
- Progress and mistakes are stored per logged-in user.
- Row Level Security prevents one student from reading another student's progress/mistakes.
- Admin-only question writes are protected by RLS and the Edge Function.
- No Supabase service-role key is placed in the browser.

## Important architecture

The browser contains only the Supabase project URL and **publishable/anon key**. That key is not a password. Supabase RLS must remain enabled.

The Edge Function contains the secret service-role key on the server side. Never paste that key into `index.html`.

## Setup — do this in order

### 1. Create a Supabase project

Go to Supabase and create a new project.

### 2. Run the SQL

Open **SQL Editor** in Supabase, create a new query, paste all of `supabase/schema.sql`, and run it.

### 3. Create the first admin

For the first admin, create an Auth user in Supabase Dashboard → Authentication → Users.
Use an email such as `admin@users.med64.local` and a strong password.

Then find that user's UUID in Authentication → Users and run:

```sql
insert into public.profiles (id, username, display_name, role, active)
values ('PASTE-ADMIN-UUID-HERE', 'admin', 'Med64 Administrator', 'admin', true)
on conflict (id) do update
set username='admin', role='admin', active=true;
```

### 4. Deploy the Edge Function

The function directory is:

`supabase/functions/med64-admin/`

Using the Supabase CLI, the official deployment flow is to authenticate, link the project, and deploy the function.

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy med64-admin
```

Supabase documents this deployment flow here: https://supabase.com/docs/guides/functions/deploy

The function uses the server-side Supabase secret key. New Supabase projects expose secret keys to Edge Functions through `SUPABASE_SECRET_KEYS`; older projects may expose `SUPABASE_SERVICE_ROLE_KEY`. **Do not put either secret in the browser or GitHub.** Supabase specifically warns that secret/service-role keys bypass RLS and must remain server-side.

The deployed function name must be:

`med64-admin`

### 5. Configure `index.html`

Open `index.html` and replace:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';
```

with your project's URL and publishable/anon key.

### 6. Deploy to Vercel

Upload/push the package to GitHub and import the repository into Vercel.

### 7. Test

1. Log in as the admin.
2. Open **User Management**.
3. Create a student with a User ID and password.
4. Log out.
5. Log in using that student ID/password.
6. Complete an exam.
7. Log out and log back in as the same student — progress should still be there.
8. Log in as another student — their progress/mistakes should be separate.

## Security notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in HTML, GitHub, or Vercel client code.
- Use Supabase project secrets/environment variables for server-side secrets.
- Keep RLS enabled.
- Use strong admin passwords.
- The synthetic student email domain is internal; students only see/use their User ID.

## Current limitation

The existing HTML app is being converted in this package to cloud-backed storage. The visual exam experience remains intentionally simple and close to the existing Med64 version. The next refinement can add richer analytics, bulk question management, and an admin dashboard without changing the authentication foundation.

## Security model

The frontend uses Supabase Auth for password authentication and the publishable key for browser access. Supabase recommends pairing the publishable key with Row Level Security (RLS). User progress and mistakes are protected by policies using the signed-in user's ID. Admin-only question changes and student account management are performed through protected server-side logic.

## What I intentionally did NOT do

- No passwords are hard-coded into the HTML.
- No service-role/secret key is included in the HTML.
- No student can read another student's progress or mistakes through the database policies.
- The admin screen cannot disable another admin; it only manages student accounts.

