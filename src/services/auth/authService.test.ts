import type { SupabaseClient } from '@supabase/supabase-js';

import { MissingSupabaseAuthService, SupabaseAuthService } from './authService';
import { AuthServiceError } from './types';

describe('auth services', () => {
  it('reports missing browser Supabase configuration', async () => {
    const service = new MissingSupabaseAuthService();

    await expect(service.getCurrentUser()).rejects.toMatchObject({
      code: 'configuration_missing',
    });
  });

  it('does not attempt sign in while offline', async () => {
    const signInWithPassword = vi.fn();
    const service = new SupabaseAuthService(
      {
        auth: {
          signInWithPassword,
        },
      } as unknown as SupabaseClient,
      {
        getOnlineStatus: () => false,
      },
    );

    await expect(
      service.signIn({ email: 'player@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(AuthServiceError);
    await expect(
      service.signIn({ email: 'player@example.com', password: 'password123' }),
    ).rejects.toMatchObject({
      code: 'network_unavailable',
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('does not attempt password updates while offline', async () => {
    const updateUser = vi.fn();
    const service = new SupabaseAuthService(
      {
        auth: {
          updateUser,
        },
      } as unknown as SupabaseClient,
      {
        getOnlineStatus: () => false,
      },
    );

    await expect(service.updatePassword('password123')).rejects.toMatchObject({
      code: 'network_unavailable',
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('reports request-level auth network failures as offline requirements', async () => {
    const service = new SupabaseAuthService(
      {
        auth: {
          signInWithPassword: vi.fn(async () => ({
            data: null,
            error: { message: 'Failed to fetch' },
          })),
        },
      } as unknown as SupabaseClient,
      {
        getOnlineStatus: () => true,
      },
    );

    await expect(
      service.signIn({ email: 'player@example.com', password: 'password123' }),
    ).rejects.toMatchObject({
      code: 'network_unavailable',
    });
  });

  it('sends signup confirmation emails back to the configured app origin', async () => {
    const signUp = vi.fn(async () => ({
      data: { session: null, user: { email: 'player@example.com', id: 'user-1' } },
      error: null,
    }));
    const service = new SupabaseAuthService(
      {
        auth: {
          signUp,
        },
      } as unknown as SupabaseClient,
      {
        emailRedirectTo: 'https://hoopjot.com',
        getOnlineStatus: () => true,
      },
    );

    await expect(
      service.signUp({ email: 'player@example.com', password: 'password123' }),
    ).resolves.toMatchObject({
      requiresEmailConfirmation: true,
      user: { email: 'player@example.com', id: 'user-1' },
    });
    expect(signUp).toHaveBeenCalledWith({
      email: 'player@example.com',
      options: {
        emailRedirectTo: 'https://hoopjot.com',
      },
      password: 'password123',
    });
  });

  it('sends password recovery emails back to the same production origin as signup', async () => {
    const resetPasswordForEmail = vi.fn(async () => ({ data: {}, error: null }));
    const service = new SupabaseAuthService(
      {
        auth: {
          resetPasswordForEmail,
        },
      } as unknown as SupabaseClient,
      {
        getOnlineStatus: () => true,
        resetRedirectUrl: 'https://hoopjot.com',
      },
    );

    await service.sendPasswordResetEmail({ email: 'player@example.com' });
    expect(resetPasswordForEmail).toHaveBeenCalledWith('player@example.com', {
      redirectTo: 'https://hoopjot.com',
    });
  });
});
