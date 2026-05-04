# AI Coding Agent Instructions for Split

This file provides essential guidance for AI coding agents working in the Split repository. It summarizes key conventions, workflows, and links to documentation to help agents be productive and avoid common pitfalls.

## Key Project Conventions

- **Database Environments:**
  - Local development uses a local Postgres database (`split_local`).
  - Remote deployment uses Neon (remote Postgres) with a different database (`split`).
  - Two environment files: `.env.local` (local), `.env.production` (Neon remote).
  - Use the provided npm scripts to switch and operate safely between environments.

- **Migrations:**
  - Generate and test migrations locally before pushing to Neon.
  - Use `npm run db:local:generate` and `npm run db:local:push` for local DB.
  - Use `npm run db:neon:generate` and `npm run db:neon:push` for Neon.
  - Never run destructive migrations against Neon unless deploying.

- **Health Checks:**
  - Use `npm run health:db`, `npm run health:db:local`, or `npm run health:db:neon` to verify DB connectivity.

## Documentation Links

- [README.md](README.md): Local vs Neon development, environment setup, and workflow details.
- [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md): Migration process and best practices.
- [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md): Database structure and design decisions.
- [CRUD_ARCHITECTURE.md](CRUD_ARCHITECTURE.md): CRUD patterns and conventions.

## Agent Guidance

- **Link, don’t duplicate:** Always link to the above docs for details.
- **Minimal by default:** Only add instructions here that are not easily discoverable or are critical for agent productivity.
- **Update this file** if new conventions or scripts are added that affect agent workflows.

---

This file is maintained to help AI agents onboard quickly and follow project conventions. If you find missing or outdated information, please update this file or notify the maintainers.
