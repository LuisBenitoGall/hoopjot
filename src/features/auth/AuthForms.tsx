import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/providers/authContext';
import { AuthServiceError, type AuthErrorCode } from '../../services/auth';
import { AuthErrorMessage, AuthSuccessMessage } from './AuthMessages';

type AuthFormMode = 'signIn' | 'signUp' | 'recovery' | 'updatePassword';

interface AuthFormProps {
  mode: AuthFormMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const {
    error,
    resetError,
    sendPasswordResetEmail,
    signIn,
    signUp,
    state,
    updatePassword
  } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localErrorCode, setLocalErrorCode] = useState<AuthErrorCode | null>(null);
  const requiresEmail = mode !== 'updatePassword';
  const requiresPassword = mode !== 'recovery';

  const errorCode =
    state.status === 'configuration_error' ? null : (localErrorCode ?? error?.code ?? null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setLocalErrorCode(null);
    resetError();

    try {
      if (mode === 'signIn') {
        await signIn({ email, password });
        navigate('/app', { replace: true });
      } else if (mode === 'signUp') {
        const result = await signUp({ email, password });

        if (result.requiresEmailConfirmation) {
          setSuccessMessage(t('auth.messages.checkEmail'));
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else if (mode === 'recovery') {
        await sendPasswordResetEmail({ email });
        setSuccessMessage(t('auth.messages.recoverySent'));
      } else {
        await updatePassword(password);
        navigate('/app', { replace: true });
      }
    } catch (caughtError) {
      setLocalErrorCode(toErrorCode(caughtError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {state.status === 'configuration_error' ? (
        <p className="rounded-card border border-hoopnote-warning/50 bg-hoopnote-warning/10 px-4 py-3 text-sm font-bold text-hoopnote-ink">
          {t('auth.errors.configuration_missing')}
        </p>
      ) : null}

      <AuthErrorMessage code={errorCode} getMessage={(code) => t(`auth.errors.${code}`)} />
      <AuthSuccessMessage message={successMessage} />

      {requiresEmail ? (
        <label className="block space-y-2">
          <span className="text-sm font-bold">{t('auth.emailLabel')}</span>
          <input
            autoComplete="email"
            className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 text-base font-semibold outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
      ) : null}

      {requiresPassword ? (
        <label className="block space-y-2">
          <span className="text-sm font-bold">
            {mode === 'updatePassword' ? t('auth.newPasswordLabel') : t('auth.passwordLabel')}
          </span>
          <input
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 text-base font-semibold outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
      ) : null}

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? t('auth.submitting') : t(`auth.${mode}.submit`)}
      </Button>

      <AuthFormLinks mode={mode} />
    </form>
  );
}

function AuthFormLinks({ mode }: { mode: AuthFormMode }) {
  const { t } = useTranslation('common');

  if (mode === 'signIn') {
    return (
      <div className="space-y-3 text-sm font-bold text-hoopnote-muted">
        <p>
          {t('auth.signIn.noAccount')}{' '}
          <Link className="text-hoopnote-blue underline" to="/sign-up">
            {t('auth.signIn.createAccount')}
          </Link>
        </p>
        <Link className="inline-flex text-hoopnote-blue underline" to="/recovery">
          {t('auth.signIn.forgotPassword')}
        </Link>
      </div>
    );
  }

  if (mode === 'updatePassword') {
    return null;
  }

  return (
    <p className="text-sm font-bold text-hoopnote-muted">
      {mode === 'signUp' ? t('auth.signUp.hasAccount') : t('auth.recovery.remembered')}{' '}
      <Link className="text-hoopnote-blue underline" to="/sign-in">
        {t('auth.signIn.submit')}
      </Link>
    </p>
  );
}

function toErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof AuthServiceError) {
    return error.code;
  }

  return 'provider_error';
}
