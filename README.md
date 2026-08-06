# Lourdes College SHS Department Website — Setup Guide

Plain HTML/CSS/JS site (no frameworks) with a Supabase backend for the
Faculty & Staff directory, teacher logins, and an admin panel.

## 1. Create your Supabase project
Go to https://supabase.com, create a project, and note your **Project URL**
and **anon public key** (Project Settings → API).

## 2. Run the database schema
Open the Supabase **SQL Editor** and run the contents of `schema.sql`.
This creates:
- `public.teachers` — the faculty directory table
- `public.admins` — marks which auth users are administrators
- Row Level Security policies (public read; teachers edit only their own
  row; admins have full access)
- The `faculty-images` storage bucket + storage policies

## 3. Connect the site to your project
Open `supabase.js` and replace the placeholders:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";
```

## 4. Create teacher logins
Client-side code can never hold a service-role key safely, so new Auth
users must be created either:
- by the teacher themselves via Supabase's sign-up/invite flow, or
- by you, from **Authentication → Users → Add user** in the Supabase
  dashboard.

Whichever way an account is created, make sure the **email matches** the
`email` field of that teacher's row in `public.teachers` (the Admin Panel's
"Add Teacher" form creates the directory entry; once a matching Auth user
signs in for the first time it links to that row automatically).

## 5. Make your first administrator
After the account exists, grab its UUID from **Authentication → Users**
and run:

```sql
insert into public.admins (user_id) values ('paste-the-uuid-here');
```

That user can now sign in at `login.html` and will be redirected to
`admin.html` instead of `dashboard.html`.

## 6. Run the site locally
Because the Supabase JS SDK uses `fetch`, serve the folder with a local
web server rather than opening files directly with `file://`:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080/index.html`.

## File overview
| File | Purpose |
|---|---|
| `index.html` | Homepage |
| `programs.html` | Academic strands |
| `faculty.html` | Faculty directory (reads Supabase) |
| `activities.html` | Student activities |
| `announcements.html` | Announcements |
| `contact.html` | Contact form |
| `login.html` | Teacher login |
| `dashboard.html` | Teacher's own profile editor |
| `admin.html` | Admin faculty management |
| `style.css` | All site styling |
| `script.js` | Shared UI behavior (nav, reveal animation, contact form) |
| `supabase.js` | Supabase client config |
| `auth.js` | Login/logout/session + route guards |
| `faculty.js` | Loads & renders the faculty directory |
| `dashboard.js` | Teacher profile edit + photo upload |
| `admin.js` | Admin CRUD, search, password reset, photo upload |
| `schema.sql` | Database schema, RLS policies, storage bucket setup |
