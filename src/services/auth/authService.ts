import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';

import {
  AuthServiceError,
  type AuthCredentials,
  type AuthRecoveryRequest,
  type AuthService,
  type AuthSignUpResult,
  type AuthStateListener,
  type AuthSubscription,
  type AuthUser
} from './types';

interface SupabaseAuthServiceOptions {
  getOnlineStatus?: () => boolean;
  resetRedirectUrl?: string;
}

export class SupabaseAuthService implements AuthService {
  private readonly getOnlineStatus: () => boolean;
  private readonly resetRedirectUrl?: string;

  constructor(
    private readonly client: SupabaseClient,
    options: SupabaseAuthServiceOptions = {},
  ) {
    this.getOnlineStatus =
      options.getOnlineStatus ??
      (() => (typeof navigator === 'undefined' ? true : navigator.onLine));
    this.resetRedirectUrl = options.resetRedirectUrl;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.getSession();

    if (error) {
      throw toAuthServiceError(error);
    }

    return toAuthUser(data.session);
  }

  onAuthStateChange(listener: AuthStateListener): AuthSubscription {
    const { data } = this.client.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
      listener(
        toAuthUser(session),
        _event === 'PASSWORD_RECOVERY' ? 'password_recovery' : 'session_changed',
      );
    });

    return {
      unsubscribe: () => data.subscription.unsubscribe()
    };
  }

  async sendPasswordResetEmail(request: AuthRecoveryRequest): Promise<void> {
    this.assertOnline();

    const { error } = await this.client.auth.resetPasswordForEmail(request.email, {
      redirectTo: request.redirectTo ?? this.resetRedirectUrl
    });

    if (error) {
      throw toAuthServiceError(error);
    }
  }

  async signIn(credentials: AuthCredentials): Promise<AuthUser> {
    this.assertOnline();

    const { data, error } = await this.client.auth.signInWithPassword(credentials);

    if (error) {
      throw toAuthServiceError(error);
    }

    const user = toAuthUser(data.session);

    if (!user) {
      throw new AuthServiceError('provider_error', 'Sign in did not return a session.');
    }

    return user;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();

    if (error) {
      throw toAuthServiceError(error);
    }
  }

  async signUp(credentials: AuthCredentials): Promise<AuthSignUpResult> {
    this.assertOnline();

    const { data, error } = await this.client.auth.signUp(credentials);

    if (error) {
      throw toAuthServiceError(error);
    }

    return {
      requiresEmailConfirmation: !data.session,
      user: toAuthUser(data.session) ?? (data.user ? toAuthUserFromSupabaseUser(data.user) : null)
    };
  }

  async updatePassword(password: string): Promise<AuthUser> {
    this.assertOnline();

    const { data, error } = await this.client.auth.updateUser({ password });

    if (error) {
      throw toAuthServiceError(error);
    }

    const user = data.user ? toAuthUserFromSupabaseUser(data.user) : await this.getCurrentUser();

    if (!user) {
      throw new AuthServiceError('provider_error', 'Password update did not return a session.');
    }

    return user;
  }

  private assertOnline(): void {
    if (!this.getOnlineStatus()) {
      throw new AuthServiceError(
        'network_unavailable',
        'A network connection is required for this authentication action.',
      );
    }
  }
}

export class MissingSupabaseAuthService implements AuthService {
  private readonly error = new AuthServiceError(
    'configuration_missing',
    'Supabase browser environment variables are not configured.',
  );

  async getCurrentUser(): Promise<AuthUser | null> {
    throw this.error;
  }

  onAuthStateChange(): AuthSubscription {
    return { unsubscribe: () => undefined };
  }

  async sendPasswordResetEmail(): Promise<void> {
    throw this.error;
  }

  async signIn(): Promise<AuthUser> {
    throw this.error;
  }

  async signOut(): Promise<void> {
    throw this.error;
  }

  async signUp(): Promise<AuthSignUpResult> {
    throw this.error;
  }

  async updatePassword(): Promise<AuthUser> {
    throw this.error;
  }
}

function toAuthUser(session: Session | null): AuthUser | null {
  return session?.user ? toAuthUserFromSupabaseUser(session.user) : null;
}

function toAuthUserFromSupabaseUser(user: User): AuthUser {
  return {
    email: user.email ?? null,
    id: user.id,
    onboardingCompleted:
      user.app_metadata?.onboarding_completed === true ||
      user.user_metadata?.onboarding_completed === true
  };
}

function toAuthServiceError(error: { message: string }): AuthServiceError {
  if (isNetworkErrorMessage(error.message)) {
    return new AuthServiceError(
      'network_unavailable',
      'A network connection is required for this authentication action.',
    );
  }

  return new AuthServiceError('provider_error', error.message);
}

function isNetworkErrorMessage(message: string): boolean {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('load failed') ||
    normalizedMessage.includes('networkerror') ||
    normalizedMessage.includes('network error')
  );
}
