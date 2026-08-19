import type { SupabaseClient } from '@supabase/supabase-js';

import { MissingSupabaseAuthService, SupabaseAuthService } from './authService';
import { AuthServiceError } from './types';

describe('auth services', () => {
  it('reports missing browser Supabase configuration', async () => {
    const service = new MissingSupabaseAuthService();

    await expect(service.getCurrentUser()).rejects.toMatchObject({
      code: 'configuration_missing'
    });
  });

  it('does not attempt sign in while offline', async () => {
    const signInWithPassword = vi.fn();
    const service = new SupabaseAuthService(
      {
        auth: {
          signInWithPassword
        }
      } as unknown as SupabaseClient,
      {
        getOnlineStatus: () => false
      },
    );

    await expect(
      service.signIn({ email: 'player@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(AuthServiceError);
    await expect(
      service.signIn({ email: 'player@example.com', password: 'password123' }),
    ).rejects.toMatchObject({
      code: 'network_unavailable'
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('does not attempt password updates while offline', async () => {
    const updateUser = vi.fn();
    const service = new SupabaseAuthService(
      {
        auth: {
          updateUser
        }
      } as unknown as SupabaseClient,
      {
        getOnlineStatus: () => false
      },
    );

    await expect(service.updatePassword('password123')).rejects.toMatchObject({
      code: 'network_unavailable'
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('reports request-level auth network failures as offline requirements', async () => {
    const service = new SupabaseAuthService(
      {
        auth: {
          signInWithPassword: vi.fn(async () => ({
            data: null,
            error: { message: 'Failed to fetch' }
          }))
        }
      } as unknown as SupabaseClient,
      {
        getOnlineStatus: () => true
      },
    );

    await expect(
      service.signIn({ email: 'player@example.com', password: 'password123' }),
    ).rejects.toMatchObject({
      code: 'network_unavailable'
    });
  });
});
