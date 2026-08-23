import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface RlsTestEnvironment {
  anonKey: string;
  emailA: string;
  emailB: string;
  passwordA: string;
  passwordB: string;
  url: string;
}

const environment = getRlsTestEnvironment();
const describeRls = environment ? describe : describe.skip;

describeRls('Supabase RLS isolation', () => {
  it('prevents one authenticated user from reading, updating or deleting another user session', async () => {
    if (!environment) {
      throw new Error('Supabase RLS test environment is not configured.');
    }

    const clientA = createRlsClient(environment);
    const clientB = createRlsClient(environment);
    const userAId = await signIn(clientA, environment.emailA, environment.passwordA);
    await signIn(clientB, environment.emailB, environment.passwordB);
    const sessionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    try {
      const insert = await clientA.from('sessions').insert({
        created_at: timestamp,
        id: sessionId,
        type: 'practice',
        updated_at: timestamp,
        user_id: userAId
      });

      expect(insert.error).toBeNull();

      const blockedRead = await clientB
        .from('sessions')
        .select('id')
        .eq('id', sessionId);

      expect(blockedRead.error).toBeNull();
      expect(blockedRead.data).toEqual([]);

      const blockedUpdate = await clientB
        .from('sessions')
        .update({ notes: 'blocked cross-user update', updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select('id');

      expect(blockedUpdate.error).toBeNull();
      expect(blockedUpdate.data).toEqual([]);

      const blockedDelete = await clientB
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .select('id');

      expect(blockedDelete.error).toBeNull();
      expect(blockedDelete.data).toEqual([]);

      const ownRead = await clientA
        .from('sessions')
        .select('id, notes')
        .eq('id', sessionId)
        .single();

      expect(ownRead.error).toBeNull();
      expect(ownRead.data).toMatchObject({ id: sessionId, notes: null });
    } finally {
      await clientA.from('sessions').delete().eq('id', sessionId);
      await clientA.auth.signOut();
      await clientB.auth.signOut();
    }
  }, 30_000);
});

function createRlsClient(testEnvironment: RlsTestEnvironment): SupabaseClient {
  return createClient(testEnvironment.url, testEnvironment.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}

async function signIn(client: SupabaseClient, email: string, password: string): Promise<string> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  expect(error).toBeNull();
  expect(data.user?.id).toBeTruthy();

  return data.user?.id ?? '';
}

function getRlsTestEnvironment(): RlsTestEnvironment | null {
  if (process.env.HOOPJOT_RUN_SUPABASE_RLS_TESTS !== 'true') {
    return null;
  }

  const environment = {
    anonKey: process.env.VITE_SUPABASE_ANON_KEY,
    emailA: process.env.HOOPJOT_RLS_TEST_EMAIL_A,
    emailB: process.env.HOOPJOT_RLS_TEST_EMAIL_B,
    passwordA: process.env.HOOPJOT_RLS_TEST_PASSWORD_A,
    passwordB: process.env.HOOPJOT_RLS_TEST_PASSWORD_B,
    url: process.env.VITE_SUPABASE_URL
  };

  return Object.values(environment).every(Boolean)
    ? (environment as RlsTestEnvironment)
    : null;
}
