import type {
  AuthService,
  AuthStateListener,
  AuthSignUpResult,
  AuthSubscription,
  AuthUser
} from './types';

const defaultE2eUserId = '11111111-1111-4111-8111-111111111111';
const e2eAuthEnabledKey = 'hoopjot:e2e-auth-service';
const e2eAuthenticatedKey = 'hoopjot:e2e-auth';
const e2eOnboardedKey = 'hoopjot:e2e-onboarded';

export function createE2EAuthService(): AuthService | null {
  if (
    import.meta.env.VITE_ENABLE_E2E_AUTH !== 'true' ||
    typeof globalThis.sessionStorage === 'undefined' ||
    !isE2EAuthServiceEnabled()
  ) {
    return null;
  }

  return new E2EAuthService();
}

function isE2EAuthServiceEnabled(): boolean {
  return (
    globalThis.sessionStorage.getItem(e2eAuthenticatedKey) === '1' ||
    globalThis.sessionStorage.getItem(e2eAuthEnabledKey) === '1'
  );
}

function readE2EUser(): AuthUser {
  return {
    email: import.meta.env.VITE_E2E_AUTH_EMAIL ?? 'player@example.com',
    id: import.meta.env.VITE_E2E_AUTH_USER_ID ?? defaultE2eUserId,
    onboardingCompleted: globalThis.sessionStorage.getItem(e2eOnboardedKey) === '1'
  };
}

class E2EAuthService implements AuthService {
  private readonly listeners = new Set<AuthStateListener>();

  async getCurrentUser(): Promise<AuthUser | null> {
    return globalThis.sessionStorage.getItem(e2eAuthenticatedKey) === '1' ? readE2EUser() : null;
  }

  onAuthStateChange(listener: AuthStateListener): AuthSubscription {
    this.listeners.add(listener);

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      }
    };
  }

  async sendPasswordResetEmail(): Promise<void> {
    return undefined;
  }

  async signIn(): Promise<AuthUser> {
    return this.authenticate();
  }

  async signOut(): Promise<void> {
    globalThis.sessionStorage?.removeItem(e2eAuthenticatedKey);
    this.notify(null);
  }

  async signUp(): Promise<AuthSignUpResult> {
    return { requiresEmailConfirmation: false, user: this.authenticate() };
  }

  async updatePassword(): Promise<AuthUser> {
    return this.authenticate();
  }

  private authenticate(): AuthUser {
    globalThis.sessionStorage.setItem(e2eAuthenticatedKey, '1');
    const user = readE2EUser();
    this.notify(user);

    return user;
  }

  private notify(user: AuthUser | null): void {
    for (const listener of this.listeners) {
      listener(user, 'session_changed');
    }
  }
}
