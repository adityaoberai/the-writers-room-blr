# The Writers' Room BLR

_A focused writing community for Bengaluru writers to create, connect, and grow together._

A community website where writers discover the meetup, sign up with a passwordless
email code, build a public profile, browse a member directory, submit writing, and
earn points and badges for taking part. Admins get a full management dashboard for
members, submissions, rewards, events and site content. Upcoming events are embedded
from Luma.

## Tech stack

- **Frontend:** SvelteKit (Svelte 5, JavaScript) with SSR via `@sveltejs/adapter-node`
- **Backend / DB / Auth:** Appwrite Cloud — Auth (email OTP), TablesDB, Storage
- **Hosting target:** Appwrite Sites (SSR)

The app is fully server-rendered. All Appwrite access happens server-side: a reusable
**admin client** (scoped API key) for privileged operations, and a per-request
**session client** (cookie secret) to act as the logged-in user. Browsers only talk to
the app's own `/api` routes and form actions.

## Project layout

```
src/
  app.html                 document shell (fonts, favicon, theme-color)
  app.css                  design tokens + base styles
  hooks.server.js          session resolution, route guards, security headers
  lib/
    constants.js           table IDs + enumerations (shared with provisioning)
    seo.js, format.js      SEO helpers, date/number formatting
    components/            Header, Footer, Seo, MemberCard, SubmissionCard,
                           EventCard, BadgeMedal, Avatar, Icon, ProfileForm, …
    server/                appwrite clients, data access, auth, profiles,
                           submissions, rewards, events, settings, admin, storage
  routes/
    +layout.*              shell + user summary
    +page.*                homepage (hero, Luma, featured, testimonials)
    signin/                email-OTP sign in (request + verify, resend timer)
    onboarding/  me/       profile setup & management + photo upload
    directory/             searchable member directory
    members/[id]/          public member profile
    writing/  writing/[id] community writing list + single piece
    events/                Luma embed + upcoming + past archive
    rewards/               points, badges, milestones, activity history
    submit/                writing submission form
    admin/                 dashboard (metrics, moderation, rewards, content, events)
    api/                   JSON endpoints (see spec)
    robots.txt/  sitemap.xml/   generated at the site root
scripts/
  provision.mjs            idempotent schema + seed provisioning
  make-og.mjs              builds favicon/app-icon/header mark + OG from static/logo.jpg
static/                    logo.jpg (source), favicon.png, apple-touch-icon.png, logo-mark.png, og.png
```

## Setup

1. **Install dependencies**

   ```sh
   pnpm install
   ```

2. **Configure environment.** Copy `.env.example` to `.env` and fill in your Appwrite
   project values:

   ```sh
   cp .env.example .env
   ```

   | Variable                   | Description                                                  |
   | -------------------------- | ------------------------------------------------------------ |
   | `APPWRITE_ENDPOINT`        | Region endpoint, e.g. `https://sgp.cloud.appwrite.io/v1`     |
   | `APPWRITE_PROJECT_ID`      | Appwrite project ID                                          |
   | `APPWRITE_API_KEY`         | Server API key (sessions, users, rows, files scopes)         |
   | `APPWRITE_DATABASE_ID`     | Database ID (`main`)                                         |
   | `APPWRITE_PHOTO_BUCKET_ID` | Storage bucket ID (`profile_photos`)                         |
   | `ADMIN_EMAILS`             | Comma-separated emails auto-promoted to admin on first login |
   | `PUBLIC_SITE_URL`          | Public origin used for canonical/OG URLs and the sitemap     |

   Admin authority is read from the Appwrite Auth user's `admin` **label**;
   `ADMIN_EMAILS` is a bootstrap that also stamps that label on first login.

3. **Provision the backend** (idempotent — safe to re-run). Creates the database,
   tables, indexes, the photo bucket, and seeds reward rules, badges, site copy and
   sample events:

   ```sh
   node --env-file=.env scripts/provision.mjs
   ```

4. **(Optional) regenerate brand assets** (OG image, favicon, apple-touch-icon):

   ```sh
   node scripts/make-og.mjs
   ```

## Run locally

```sh
pnpm run dev            # dev server at http://localhost:5173
pnpm run build          # production build (outputs ./build)
node --env-file=.env build/index.js   # run the production server (adapter-node)
pnpm run lint           # prettier + eslint
pnpm run format         # apply prettier
```

## Deploy to Appwrite Sites

Push the repo to GitHub and create an Appwrite Site:

- Framework: **SvelteKit**, rendering **SSR** (`@sveltejs/adapter-node`)
- Install command: `pnpm install` · Build command: `pnpm run build` · Output: `build`
- Set the same environment variables in the Site's settings.

## Events gallery

Past-meetup photos for the homepage "Moments from the room" carousel live in
`static/events-gallery/` and are served at `/events-gallery/<filename>`. They're
listed automatically (sorted by filename) by `src/lib/server/gallery.js`, and the
section hides itself when the folder has no images.

- Add `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif` or `.gif` files to
  `static/events-gallery/`. No code change needed; reload to see them.
- Files are served as-is, so **optimize before adding** (landscape, ~1600px wide).
  You can recompress with `sharp`, e.g. resize to 1600px at quality 80, which takes
  a typical camera JPG from ~14MB down to ~150KB.
- Prefix filenames with `01-`, `02-`, … to control the carousel order.

## Data model

Appwrite TablesDB database `main` with tables: `users`, `profiles`,
`member_directory_entries`, `writing_submissions`, `events`, `rewards_rules`,
`activity_logs`, `badges`, `user_badges`, `site_settings`. Profile photos live in the
`profile_photos` storage bucket.

## Product decisions

- **Directory visibility:** profiles are public by default but only appear in the
  directory once the member has shared at least one (non-rejected) submission. Admins
  can also approve a profile to list it, and feature members/pieces.
- **Submissions:** support both on-site full text and external links.
- **Rewards:** points and badges only (no redemption). Points are awarded for
  submissions, profile completion, attendance, referrals and prompts, with duplicate
  protection; badges unlock at point/submission/attendance/profile milestones.
