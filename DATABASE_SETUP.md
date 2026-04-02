# Development & Deployment Setup

This guide explains how to set up local development with PostgreSQL and deploy to Neon.

## Local Development Setup

### Prerequisites

- Docker & Docker Compose (or PostgreSQL installed locally)
- Node.js 22+
- Git

### 1. Start Local Database

```bash
# Start PostgreSQL container in the background
npm run docker:up

# Verify it's running
npm run docker:logs

# Stop it when done
npm run docker:down
```

This will start PostgreSQL on `localhost:5432` with:

- Username: `split_user`
- Password: `split_password`
- Database: `split_db`

### 2. Create Database Tables

```bash
# Push schema to local database
npm run db:push
```

### 3. Start Development Server

```bash
# In a new terminal, start Astro dev server
npm run dev

# Visit http://localhost:4321/
```

### 4. Inspect Data (Optional)

```bash
# Open Drizzle Studio to view/manage database
npm run db:studio
```

## Switching Between Local & Neon

### Using Local Database

Your `.env.local` is already configured for local PostgreSQL:

```
DATABASE_URL=postgresql://split_user:split_password@localhost:5432/split_db
```

### Switching to Neon

When deploying to production:

1. Copy `.env.production.example` to `.env.production`
2. Update with your actual Neon credentials
3. Push schema to Neon:
   ```bash
   # Use production env
   ENVIRONMENT=production npm run db:push
   ```

**Important:** Never commit `.env.local` or `.env.production` (Git ignores them).

## Docker Commands

```bash
npm run docker:up        # Start database container
npm run docker:down      # Stop container
npm run docker:restart   # Restart container
npm run docker:logs      # View container logs
```

## Database Scripts

```bash
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate migration files
npm run db:studio        # Open Drizzle Studio UI
npm run db:seed          # Seed database with sample data (if available)
```

## Production Deployment (Neon)

### Step 1: Create Neon Database

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create new project
3. Copy connection string (SQL connection)

### Step 2: Configure Environment

```bash
# Copy example to production
cp .env.production.example .env.production

# Edit .env.production and add your Neon credentials
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname
SESSION_SECRET=<generate-strong-key>
NODE_ENV=production
```

### Step 3: Push Schema

```bash
# Make sure you have .env.production with Neon credentials
drizzle-kit push --config drizzle.config.ts
```

### Step 4: Deploy to Railway (or other host)

1. Push code to GitHub
2. Connect repository to Railway
3. Set environment variables in Railway dashboard
4. Deploy!

## Environment Files

- **`.env.local`** - Local development (ignored by Git)
- **`.env.production.example`** - Template for production (committed to Git)
- **`.env.production`** - Actual production secrets (ignored by Git)

## Troubleshooting

### Docker Issues

```bash
# Container won't start
docker-compose down -v    # Remove volumes and restart
npm run docker:up

# Permission denied
# On Windows/Mac, make sure Docker Desktop is running
```

### Database Connection Issues

```bash
# Verify local database is running
npm run docker:logs

# Check connection string in .env.local
# Format: postgresql://user:password@host:port/database
```

### Migration Issues

```bash
# Reset local database (careful - deletes all data!)
docker-compose down -v
npm run docker:up
npm run db:push
```

## Next Steps

1. ✅ Docker database is running
2. ✅ Schema is pushed to database
3. ✅ Dev server is running
4. 👉 **Start Phase 2: Core Features**
   - Event management
   - Expense groups
   - Tracking expenses

## References

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Neon Documentation](https://neon.tech/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Astro Docs](https://docs.astro.build/)
