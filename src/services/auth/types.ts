export interface AuthUser {
  email: string | null;
  id: string;
  onboardingCompleted: boolean;
}

export interface AuthSignUpResult {
  requiresEmailConfirmation: boolean;
  user: AuthUser | null;
}

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'configuration_error';

export type AuthState =
  | { status: 'loading'; user: null; message?: undefined }
  | { status: 'unauthenticated'; user: null; message?: undefined }
  | { status: 'configuration_error'; user: null; message: string }
  | {
      isPasswordRecoverySession: boolean;
      status: 'authenticated';
      user: AuthUser;
      message?: undefined;
    };

export type AuthErrorCode = 'configuration_missing' | 'network_unavailable' | 'provider_error';

export class AuthServiceError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
  }
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthRecoveryRequest {
  email: string;
  redirectTo?: string;
}

export type AuthSessionEvent = 'password_recovery' | 'session_changed';

export type AuthStateListener = (user: AuthUser | null, event: AuthSessionEvent) => void;

export interface AuthSubscription {
  unsubscribe(): void;
}

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  onAuthStateChange(listener: AuthStateListener): AuthSubscription;
  sendPasswordResetEmail(request: AuthRecoveryRequest): Promise<void>;
  signIn(credentials: AuthCredentials): Promise<AuthUser>;
  signOut(): Promise<void>;
  signUp(credentials: AuthCredentials): Promise<AuthSignUpResult>;
  updatePassword(password: string): Promise<AuthUser>;
}
