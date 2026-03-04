# Deploy Supabase schema/functions via GitHub Actions

## Setup

### 1. Get Supabase credentials
Go to Supabase Dashboard → Settings → API, get:
- `PROJECT_REF` - Project reference (e.g., `xyzabc123`)
- `SUPABASE_ACCESS_TOKEN` - Personal access token (Settings → Access Tokens)

### 2. Add GitHub Secrets
In GitHub repo → Settings → Secrets → Actions:
- `SUPABASE_ACCESS_TOKEN` - Your personal access token
- `PROJECT_REF` - Your project reference

### 3. Push migrations folder
When you push to `main`, GitHub Actions will:
1. Link to Supabase using `supabase/config.toml`
2. Run `supabase db push` to apply all migrations

---

## GitHub Actions Workflow

```yaml
# .github/workflows/supabase-deploy.yml
name: Deploy Supabase Schema

on:
  push:
    branches: [main]
    paths:
      - 'supabase/**'
      - 'docs/supabase-schema.sql'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          supabase-version: latest

      - run: supabase link --project-ref ${{ secrets.PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - run: supabase db push --db-url postgres://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          # Or use password from secrets
```

---

## Alternative: Manual Migration

If you prefer manual control, keep the SQL file in `docs/supabase-schema.sql` and run it manually in Supabase Dashboard → SQL Editor.

---

## Notes

- `supabase/migrations/` folder = version-controlled schema
- Each file is a migration (timestamp prefix)
- `supabase db push` applies pending migrations
- Supabase CLI handles migration tracking automatically