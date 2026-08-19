import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import {
  AuthServiceError,
  createBrowserAuthService,
  type AuthCredentials,
  type AuthRecoveryRequest,
  type AuthService,
  type AuthState,
  type AuthUser
} from '../../services/auth';
import type { PlayerProfileRepository } from '../../domain';
import { AuthContext, type AuthContextValue } from './authContext';

interface AuthProviderProps {
  authService?: AuthService;
  children: ReactNode;
  playerProfileRepository?: PlayerProfileRepository;
}

export function AuthProvider({
  authService,
  children,
  playerProfileRepository
}: AuthProviderProps) {
  const service = useMemo(() => authService ?? createBrowserAuthService(), [authService]);
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });
  const [error, setError] = useState<AuthServiceError | null>(null);

  const resolveOnboardingStatus = useCallback(
    async (user: AuthUser | null): Promise<AuthUser | null> => {
      if (!user || user.onboardingCompleted || !playerProfileRepository) {
        return user;
      }

      const profile = await playerProfileRepository.getByUserId(user.id);

      return {
        ...user,
        onboardingCompleted: Boolean(profile?.onboardingCompletedAt)
      };
    },
    [playerProfileRepository],
  );

  useEffect(() => {
    let mounted = true;
    const initialRecoveryIntent = hasPasswordRecoveryIntent();

    service
      .getCurrentUser()
      .then((user) => resolveOnboardingStatus(user))
      .then((user) => {
        if (mounted) {
          setState(fromAuthUser(user, Boolean(user && initialRecoveryIntent)));
        }
      })
      .catch((caughtError) => {
        if (mounted) {
          setError(toAuthServiceError(caughtError));
          setState(toAuthStateFromError(caughtError));
        }
      });

    const subscription = service.onAuthStateChange((user, event) => {
      void resolveOnboardingStatus(user).then((resolvedUser) => {
        if (!mounted) {
          return;
        }

        setState((currentState) =>
          fromAuthUser(
            resolvedUser,
            event === 'password_recovery' ||
              Boolean(
                resolvedUser &&
                  currentState.status === 'authenticated' &&
                  currentState.isPasswordRecoverySession,
              ),
          ),
        );
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveOnboardingStatus, service]);

  const signIn = useCallback(
    async (credentials: AuthCredentials) => {
      setError(null);

      try {
        const user = await resolveOnboardingStatus(await service.signIn(credentials));

        if (!user) {
          throw new AuthServiceError('provider_error', 'Authentication failed.');
        }

        setState({ isPasswordRecoverySession: false, status: 'authenticated', user });
      } catch (caughtError) {
        const authError = toAuthServiceError(caughtError);
        setError(authError);
        throw authError;
      }
    },
    [resolveOnboardingStatus, service],
  );

  const signUp = useCallback(
    async (credentials: AuthCredentials) => {
      setError(null);

      try {
        const result = await service.signUp(credentials);
        const user = await resolveOnboardingStatus(result.user);

        if (user && !result.requiresEmailConfirmation) {
          setState({
            isPasswordRecoverySession: false,
            status: 'authenticated',
            user
          });
        }

        return { ...result, user };
      } catch (caughtError) {
        const authError = toAuthServiceError(caughtError);
        setError(authError);
        throw authError;
      }
    },
    [resolveOnboardingStatus, service],
  );

  const signOut = useCallback(async () => {
    setError(null);

    try {
      await service.signOut();
      setState({ status: 'unauthenticated', user: null });
    } catch (caughtError) {
      const authError = toAuthServiceError(caughtError);
      setError(authError);
      throw authError;
    }
  }, [service]);

  const sendPasswordResetEmail = useCallback(
    async (request: AuthRecoveryRequest) => {
      setError(null);

      try {
        await service.sendPasswordResetEmail(request);
      } catch (caughtError) {
        const authError = toAuthServiceError(caughtError);
        setError(authError);
        throw authError;
      }
    },
    [service],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      setError(null);

      try {
        const user = await resolveOnboardingStatus(await service.updatePassword(password));

        if (!user) {
          throw new AuthServiceError('provider_error', 'Authentication failed.');
        }

        setState({ isPasswordRecoverySession: false, status: 'authenticated', user });
      } catch (caughtError) {
        const authError = toAuthServiceError(caughtError);
        setError(authError);
        throw authError;
      }
    },
    [resolveOnboardingStatus, service],
  );

  const refreshOnboardingStatus = useCallback(async () => {
    if (state.status !== 'authenticated') {
      return;
    }

    const user = await resolveOnboardingStatus({
      ...state.user,
      onboardingCompleted: false
    });

    if (user) {
      setState({
        isPasswordRecoverySession: state.isPasswordRecoverySession,
        status: 'authenticated',
        user
      });
    }
  }, [resolveOnboardingStatus, state]);

  const value = useMemo<AuthContextValue>(
    () => ({
      error,
      refreshOnboardingStatus,
      resetError: () => setError(null),
      sendPasswordResetEmail,
      signIn,
      signOut,
      signUp,
      state,
      updatePassword
    }),
    [
      error,
      refreshOnboardingStatus,
      sendPasswordResetEmail,
      signIn,
      signOut,
      signUp,
      state,
      updatePassword
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function fromAuthUser(user: AuthUser | null, isPasswordRecoverySession = false): AuthState {
  return user
    ? { isPasswordRecoverySession, status: 'authenticated', user }
    : { status: 'unauthenticated', user: null };
}

function toAuthStateFromError(error: unknown): AuthState {
  const authError = toAuthServiceError(error);

  if (authError.code === 'configuration_missing') {
    return { status: 'configuration_error', user: null, message: authError.message };
  }

  return { status: 'unauthenticated', user: null };
}

function toAuthServiceError(error: unknown): AuthServiceError {
  if (error instanceof AuthServiceError) {
    return error;
  }

  return new AuthServiceError('provider_error', 'Authentication failed.');
}

function hasPasswordRecoveryIntent(): boolean {
  if (typeof globalThis.location === 'undefined') {
    return false;
  }

  const searchParams = new URLSearchParams(globalThis.location.search);
  const hashParams = new URLSearchParams(globalThis.location.hash.replace(/^#/, ''));

  return searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
}
