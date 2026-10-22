# Ministry Flow

Ministry Flow is a standalone React application with its own PostgreSQL-backed API. It deploys to Vercel and does not use a Base44 runtime or SDK.

## Requirements

- Node.js 20 or newer
- npm
- A PostgreSQL database (a pooled Neon connection is suitable for Vercel)

## Configure the database

Create a PostgreSQL database and a restricted runtime role named `ministry_flow_app`. As the database owner, run `CREATE ROLE ministry_flow_app LOGIN PASSWORD '<a-long-unique-password>';` and grant it `CONNECT` on the database. Set `DATABASE_URL` to the runtime role's pooled connection string and `DATABASE_ADMIN_URL` to a privileged connection used only for migrations and account setup. After applying the schema, run `db/privileges.sql` as the database owner to grant the runtime role its required table access. Copy `.env.example` to `.env.local` for local development, and keep that file private.

Apply the schema:

```bash
npm run db:migrate
```

Create the first administrator. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are read from your environment; use a password of at least 12 characters. This command refuses to create a second initial administrator.

```bash
npm run create-admin
```

To create additional accounts, use `npm run user:create -- <email> [user|admin]`. The command generates a temporary password and prints it once; deliver it securely. Accounts are not publicly self-registered.

## Configure sign-in and email

Set `DATABASE_URL`, `APP_URL`, and the values below in Vercel Project Settings → Environment Variables. Keep the privileged `DATABASE_ADMIN_URL` out of Vercel; use it only for local database setup commands.

- `DATABASE_URL`: pooled PostgreSQL URL for the restricted `ministry_flow_app` runtime role

- `APP_URL`: canonical application origin, for example `https://your-domain.vercel.app`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth client credentials. Add `${APP_URL}/api/auth/google/callback` as an authorized redirect URI in Google Cloud.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`: credentials for password reset email delivery.

Email/password login works without Google configured. Google sign-in and password recovery report a configuration error until their credentials are added.

## Run locally

```bash
npm start
```

`npm start` and `npm run dev` run Vite with the project API middleware, serving the frontend and API together. Configure `.env.local` and apply the database schema before opening the app.

## Deploy to Vercel

Import this repository in Vercel, add the environment variables above, and deploy. `vercel.json` configures the Vite build output and SPA routes; the `api/` directory provides the serverless API. Apply `db/schema.sql` to the production database with `npm run db:migrate` using the production `DATABASE_ADMIN_URL` before using the deployed app.

## Checks

```bash
npm run build
npm run lint
npm run typecheck
```

The current typecheck reports existing JSX component prop typing errors; the production build and lint checks pass.

## Data migration

The previous frontend client in this repository was a local mock, not a live data connection. The new PostgreSQL database starts empty. Export any records from the former hosted application separately before migrating them into the new database.
