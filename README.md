# Local vs Neon Development Guide

This project supports developing locally against a local Postgres database and pushing migrations to Neon (the remote Postgres) for deployment. The setup uses two environment configurations and small helper scripts to switch between them safely.

What’s in this repo
- Two environment files:
  - .env.local (local Postgres connection)
- .env.neon (Neon remote connection)
- Two-env scripts (added to package.json):
- db:local:generate
- db:local:push
- db:neon:generate
- db:neon:push
- Health check utility:
- scripts/db-healthcheck.js (ES module friendly; prints sanitized connection info)
- health:db, health:db:local, health:db:neon
- .gitignore updated to ignore the env files

Two-env workflow overview
- Local development uses a local database named split_local.
- Remote deployment uses Neon with a different database (e.g., split).
- You switch between them by changing the active DATABASE_URL (via env files and the two-env scripts).

Prerequisites
- Node.js and npm installed
- Two Postgres databases available:
  - Local: a database named split_local
  - Neon: your Neon database (host, user, password, and db name)
- Optional: dotenv-cli installed as a dev dependency (the repo already adds dotenv-cli for env switching)

Key commands (copy-paste-ready)
1) Local development against split_local
- Generate migrations for local DB:
  npm run db:local:generate
- Push migrations to local DB:
  npm run db:local:push
- Health check (verify connectivity to local DB):
  npm run health:db:local

2) Push to Neon (remote Neon DB)
- Generate migrations for Neon:
  npm run db:neon:generate
- Push migrations to Neon:
  npm run db:neon:push
- Health check (verify connectivity to Neon):
  npm run health:db:neon

3) Quick health checks (alternative form)
- Health against the active database (the DATABASE_URL in the active env):
  npm run health:db
- Health explicitly against Neon:
  npm run health:db:neon
- Health explicitly against Local:
  npm run health:db:local

Switching between environments (two-env workflow)
- Local: use .env.local for DATABASE_URL, then run the local db commands:
  npm run db:local:generate
  npm run db:local:push
  npm run health:db:local
- Neon: use .env.neon for DATABASE_URL, then run Neon commands:
  npm run db:neon:generate
  npm run db:neon:push
  npm run health:db:neon

Environment file contents (for reference only)
- .env.local
  DATABASE_URL=postgresql://localuser:localpass@localhost:5432/split_local?sslmode=disable
- .env.neon
  DATABASE_URL=postgresql://neon_user:neon_pass@neon-host:5432/split?sslmode=require

Sanitized health output
- The health script prints a sanitized URL so you can see which DB you’re testing without exposing password values.
- You’ll see lines like:
  DB health OK [Neon]: postgres://neon_user:****@neon-host:5432/split?sslmode=require -> true

Notes
- Keep the two environments isolated. Do not run destructive migrations against Neon unless you intend to deploy there.
- Migrations live in version control. Use the local env to generate and test migrations, then push to Neon when you’re ready to deploy.
- If you want, I can add a small README snippet with more details or a short script to toggle between environments with a single command.

Next steps
- If you’d like, I can add a tiny wrapper script to toggle between environments with a single command (env:local / env:neon) and a quick health-check as part of a single run.

## Health Checks

Health checks verify connectivity to the currently active database by attempting a simple query against the active DATABASE_URL.
- The script loads .env.local automatically if DATABASE_URL is not set, so you can test locally without extra steps.
- It runs a simple query: SELECT 1. If the query succeeds, connectivity is healthy. If it fails, you’ll see an error that helps diagnose the issue (DNS, host, credentials, network, etc.).
- The script prints a sanitized URL in its log so you can tell which database you’re testing without exposing credentials. It also prints a label (Neon or Local).

How to use
- Test the currently active database:
  - npm run health:db
- Test Neon explicitly:
  - npm run health:db:neon
- Test Local explicitly:
  - npm run health:db:local

Interpreting results
- OK: Connectivity to the target database is healthy. You can proceed with migrations and pushes.
- Error: Investigate the cause (invalid credentials, network issue, wrong host/port, database not found, etc.).

Notes
- The health check output sanitizes passwords to avoid leaking secrets in logs.
- If you want to adjust the health script, you can edit scripts/db-healthcheck.js; it’s ES module friendly and resilient to missing env files.
