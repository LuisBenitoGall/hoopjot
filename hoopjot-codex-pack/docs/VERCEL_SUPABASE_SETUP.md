# Vercel + Supabase setup checklist

This document intentionally avoids secrets. Fill real values only in platform dashboards or local uncommitted `.env` files.

## Supabase

Create a project and record browser-safe values for:
- project URL;
- public/publishable/anon key.

Configure email authentication according to the chosen email flow.

When spec 012 is implemented:
- apply SQL migrations;
- verify RLS is enabled;
- test cross-user isolation;
- configure allowed frontend URLs for local development, Vercel previews if appropriate, and production.

Do not expose the service-role key to the frontend.

## Vercel

Import the GitHub repository.

Framework/build:
- Vite
- install: `pnpm install --frozen-lockfile`
- build: `pnpm build`
- output: Vite default `dist`

Configure environment variables required by the browser client.

Use Preview Deployments for milestone review.

## Local environment

Keep `.env.local` uncommitted.

Commit `.env.example` only with placeholders.

## Deployment flow

```text
feature branch
  ↓
pull request
  ↓
Vercel preview
  ↓
mobile/manual review + automated checks
  ↓
merge
  ↓
production deployment
```
