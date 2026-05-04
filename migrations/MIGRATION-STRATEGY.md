Yes, we are using drizzle-kit for database migrations.

Based on your package.json and the project guidelines (AGENTS.md), the project uses a set of NPM scripts that wrap drizzle-kit commands using dotenv to target either your local Postgres environment or your remote Neon database safely.

Here is the current workflow for applying migrations:

1. Local Development (Always do this first) Generate and test migrations locally against your split_local database:

Generate migration files: npm run db:local:generate (Runs drizzle-kit generate using .env.local)
Apply to local DB: npm run db:local:push (Runs drizzle-kit push using .env.local)
2. Remote/Neon Deployment Only push migrations to Neon when you are ready to deploy or sync the remote database:

Generate migration files (if needed remotely): npm run db:neon:generate (Uses .env.production)
Apply to remote Neon DB: npm run db:neon:push (Runs drizzle-kit push using .env.production)
WARNING

According to your project's rules, never run destructive migrations against Neon unless deploying. Always generate and verify them locally first.