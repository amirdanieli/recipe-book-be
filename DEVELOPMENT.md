Local development (Postgres)

This project can run a local Postgres for development with Docker Compose.

Start local Postgres and Adminer:

    docker compose up -d

Set your `.env` `DATABASE_URL` to the local DB:

    DATABASE_URL="postgresql://postgres:devpassword@localhost:5432/postgres"

Run Prisma migrations:

    npx prisma migrate dev --name init_local

Access Adminer at http://localhost:8080 (Postgres, host `localhost`, user `postgres`, password `devpassword`, db `postgres`).

To switch to production, replace the `DATABASE_URL` value in your `.env` with the production connection string. No code changes required.

Notes:
- Do not commit secrets.
- For Supabase-specific features consider using the Supabase CLI (`supabase start`).
