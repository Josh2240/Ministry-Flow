# Project Context

Ministry Flow is a user-owned Vite and React application with a project-owned Node API, PostgreSQL database, and Vercel deployment. Keep changes focused, preserve existing behavior, and do not add dependencies on Base44.

Start with `README.md` for local setup, environment variables, database setup, and deployment.

## Key Files

- `src/`: frontend application.
- `src/api/client.js`: project API client.
- `api/`: Vercel serverless API routes.
- `server/`: authentication, data validation, and PostgreSQL access.
- `db/schema.sql`: PostgreSQL schema.
- `vercel.json`: Vercel build and SPA routing configuration.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `npm start` or `npm run dev` for local development through the Vercel CLI.
- Run `npm run db:migrate` after configuring `DATABASE_URL`.
- Run the relevant checks from `package.json` before finishing code changes.
