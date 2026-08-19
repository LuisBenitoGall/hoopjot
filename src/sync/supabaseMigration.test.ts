import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260818155308_create_user_owned_tables.sql',
);

const userOwnedTables = [
  'profiles',
  'player_goals',
  'sessions',
  'daily_focus',
  'check_ins',
  'reflections',
  'observations',
  'skill_state',
  'weekly_reviews'
];

describe('Supabase user-owned migration', () => {
  const migrationSql = readFileSync(migrationPath, 'utf8');

  it('uses authenticated-only grants and RLS for every exposed table', () => {
    for (const table of userOwnedTables) {
      expect(migrationSql).toContain(`create table public.${table}`);
      expect(migrationSql).toContain(
        `grant select, insert, update, delete on table public.${table} to authenticated;`,
      );
      expect(migrationSql).toContain(`alter table public.${table} enable row level security;`);
      expect(migrationSql).toContain(`alter table public.${table} force row level security;`);
    }

    expect(migrationSql).not.toMatch(/\bto\s+anon\b/i);
    expect(migrationSql).not.toMatch(/\bauth\.role\s*\(/i);
    expect(migrationSql).not.toMatch(/\bservice_role\b/i);
  });

  it('keys row access to auth.uid with update WITH CHECK policies', () => {
    for (const table of userOwnedTables) {
      expect(migrationSql).toMatch(
        new RegExp(`create policy ${table}_select_own on public\\.${table}[\\s\\S]*?using \\(\\(select auth\\.uid\\(\\)\\) = user_id\\);`, 'm'),
      );
      expect(migrationSql).toMatch(
        new RegExp(`create policy ${table}_insert_own on public\\.${table}[\\s\\S]*?with check \\(\\(select auth\\.uid\\(\\)\\) = user_id\\);`, 'm'),
      );
      expect(migrationSql).toMatch(
        new RegExp(`create policy ${table}_update_own on public\\.${table}[\\s\\S]*?using \\(\\(select auth\\.uid\\(\\)\\) = user_id\\)[\\s\\S]*?with check \\(\\(select auth\\.uid\\(\\)\\) = user_id\\);`, 'm'),
      );
      expect(migrationSql).toMatch(
        new RegExp(`create policy ${table}_delete_own on public\\.${table}[\\s\\S]*?using \\(\\(select auth\\.uid\\(\\)\\) = user_id\\);`, 'm'),
      );
    }
  });
});
