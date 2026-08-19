import { createContext, useContext } from 'react';

import {
  AuthServiceError,
  type AuthCredentials,
  type AuthRecoveryRequest,
  type AuthSignUpResult,
  type AuthState
} from '../../services/auth';

export interface AuthContextValue {
  error: AuthServiceError | null;
  resetError: () => void;
  sendPasswordResetEmail: (request: AuthRecoveryRequest) => Promise<void>;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<AuthSignUpResult>;
  refreshOnboardingStatus: () => Promise<void>;
  state: AuthState;
  updatePassword: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
