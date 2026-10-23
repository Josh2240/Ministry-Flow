# Ministry Flow

Ministry Flow is a standalone React application with its own PostgreSQL-backed API. It deploys to Vercel and does not use a Base44 runtime or SDK.

## Requirements

- Node.js 20 or newer
- npm
- A PostgreSQL database (a pooled Neon connection is suitable for Vercel)

## Configure the database

Create a PostgreSQL database and a restricted runtime role named `ministry_flow_app`. As the database owner, run `CREATE ROLE ministry_flow_app LOGIN PASSWORD '<a-long-unique-password>';` and grant it `CONNECT` on the database. Set `DATABASE_URL` to the runtime role's pooled connection string and `DATABASE_ADMIN_URL` to a privileged owner connection used only for migrations and account setup. Copy `.env.example` to `.env.local`, replace all example values with your real local values, and keep that file private. Do not put `DATABASE_ADMIN_URL` in Vercel.

Apply the schema:

```bash
npm run db:migrate
```

Create the first administrator before making the app available for sign-up. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are read from your environment; use a password of at least 12 characters. This command refuses to create a second administrator and can promote the configured email if it already registered.

```bash
npm run create-admin
```

Users can register at `/register` with an email address and password, then verify their email with a one-time code. Google sign-in also creates a regular user account for verified Google email addresses. Configure SMTP before enabling registration; administrator accounts should be created with `npm run create-admin` or `npm run user:create -- <email> admin`.

To create additional accounts manually, use `npm run user:create -- <email> [user|admin]`. The command generates a temporary password and prints it once; deliver it securely.

## Configure sign-in and email

Set `DATABASE_URL`, `APP_URL`, and the values below in Vercel Project Settings → Environment Variables. Keep the privileged `DATABASE_ADMIN_URL` out of Vercel; use it only for local database setup commands.

- `DATABASE_URL`: pooled PostgreSQL URL for the restricted `ministry_flow_app` runtime role

- `APP_URL`: canonical application origin, for example `https://your-domain.vercel.app`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth client credentials. Add `${APP_URL}/api/auth/google/callback` as an authorized redirect URI in Google Cloud.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`: credentials for registration verification and password reset emails.

Email/password login works without Google configured. Public email sign-up and password recovery require SMTP configuration. Google sign-in and sign-up report a configuration error until Google credentials are added.

## Run locally

```bash
npm start
```

`npm start` and `npm run dev` run Vite with the project API middleware, serving the frontend and API together. Configure `.env.local` with working `DATABASE_URL`, `DATABASE_ADMIN_URL`, SMTP and Google settings as needed. Apply the database schema and privileges with `npm run db:migrate` using the database-owner `DATABASE_ADMIN_URL` before testing sign-up.

## Deploy to Vercel

Import this repository in Vercel, add the runtime environment variables above, and deploy. Keep `DATABASE_ADMIN_URL` out of Vercel. Before using the deployed app, run `npm run db:migrate` locally with the production database owner's connection string in local `DATABASE_ADMIN_URL`; the command applies the schema and runtime privileges. `vercel.json` configures the Vite build output and SPA routes; the `api/` directory provides the serverless API.

## Checks

```bash
npm run build
npm run lint
npm run typecheck
```

The current typecheck reports existing JSX component prop typing errors; the production build and lint checks pass.

## Data migration

The previous frontend client in this repository was a local mock, not a live data connection. The new PostgreSQL database starts empty. Export any records from the former hosted application separately before migrating them into the new database.
