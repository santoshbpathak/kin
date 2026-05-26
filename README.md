# KIN MVP

## Local Development

Run the app locally without installing PostgreSQL:

```bash
pnpm install
pnpm dev:local
```

This starts:

- Web: `http://localhost:5173`
- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`

`dev:local` uses SQL.js as a local-only database so the Nest API can boot on
machines that do not have PostgreSQL or Docker installed. This is only for Part
1 local development. Supabase Postgres remains the target database for the POC
deployment work in Part 2.

For PostgreSQL/Supabase-style local development, use:

```bash
pnpm dev
```

and provide the database settings from `apps/api/.env.example`.
