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

const fieldClassName =
  'min-h-12 w-full rounded-card border-2 border-hoopjot-line bg-white px-4 text-base font-semibold outline-none focus:border-hoopjot-blue focus:ring-4 focus:ring-hoopjot-blue/20';

export function AuthForm({ mode }: AuthFormProps) {
  const { error, resetError, sendPasswordResetEmail, signIn, signUp, state, updatePassword } =
    useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localErrorCode, setLocalErrorCode] = useState<AuthErrorCode | null>(null);

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
        if (password !== passwordConfirmation) {
          throw new AuthServiceError('password_mismatch', 'Passwords do not match.');
        }

        await signUp({ email, password });
        navigate('/onboarding', { replace: true });

        // Confirmation-email client flow (restore if Confirm email is re-enabled):
        // const result = await signUp({ email, password });
        // if (result.requiresEmailConfirmation) {
        //   setSuccessMessage(t('auth.messages.checkEmail'));
        // } else {
        //   navigate('/onboarding', { replace: true });
        // }
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
        <p className="rounded-card border border-hoopjot-warning/50 bg-hoopjot-warning/10 px-4 py-3 text-sm font-bold text-hoopjot-ink">
          {t('auth.errors.configuration_missing')}
        </p>
      ) : null}

      <AuthErrorMessage code={errorCode} getMessage={(code) => t(`auth.errors.${code}`)} />
      <AuthSuccessMessage message={successMessage} />

      {mode === 'signUp' ? (
        <div className="space-y-5">
          <AuthLabeledInput
            autoComplete="email"
            id="signup-email"
            label={t('auth.emailLabel')}
            name="email"
            onChange={setEmail}
            type="email"
            value={email}
          />
          <AuthLabeledInput
            autoComplete="new-password"
            id="signup-password"
            label={t('auth.passwordLabel')}
            minLength={8}
            name="password"
            onChange={setPassword}
            type="password"
            value={password}
          />
          <AuthLabeledInput
            autoComplete="new-password"
            id="signup-password-confirmation"
            label={t('auth.confirmPasswordLabel')}
            minLength={8}
            name="password_confirmation"
            onChange={setPasswordConfirmation}
            type="password"
            value={passwordConfirmation}
          />
        </div>
      ) : (
        <>
          {mode !== 'updatePassword' ? (
            <AuthLabeledInput
              autoComplete="email"
              id={`${mode}-email`}
              label={t('auth.emailLabel')}
              name="email"
              onChange={setEmail}
              type="email"
              value={email}
            />
          ) : null}

          {mode !== 'recovery' ? (
            <AuthLabeledInput
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              id={`${mode}-password`}
              label={
                mode === 'updatePassword' ? t('auth.newPasswordLabel') : t('auth.passwordLabel')
              }
              minLength={8}
              name="password"
              onChange={setPassword}
              type="password"
              value={password}
            />
          ) : null}
        </>
      )}

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? t('auth.submitting') : t(`auth.${mode}.submit`)}
      </Button>

      <AuthFormLinks mode={mode} />
    </form>
  );
}

function AuthLabeledInput({
  autoComplete,
  id,
  label,
  minLength,
  name,
  onChange,
  type,
  value,
}: {
  autoComplete: string;
  id: string;
  label: string;
  minLength?: number;
  name: string;
  onChange: (value: string) => void;
  type: 'email' | 'password';
  value: string;
}) {
  return (
    <div className="block space-y-2">
      <label className="text-sm font-bold" htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className={fieldClassName}
        id={id}
        minLength={minLength}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </div>
  );
}

function AuthFormLinks({ mode }: { mode: AuthFormMode }) {
  const { t } = useTranslation('common');

  if (mode === 'signIn') {
    return (
      <div className="space-y-3 text-sm font-bold text-hoopjot-muted">
        <p>
          {t('auth.signIn.noAccount')}{' '}
          <Link className="text-hoopjot-blue underline" to="/sign-up">
            {t('auth.signIn.createAccount')}
          </Link>
        </p>
        <Link className="inline-flex text-hoopjot-blue underline" to="/recovery">
          {t('auth.signIn.forgotPassword')}
        </Link>
      </div>
    );
  }

  if (mode === 'updatePassword') {
    return null;
  }

  return (
    <p className="text-sm font-bold text-hoopjot-muted">
      {mode === 'signUp' ? t('auth.signUp.hasAccount') : t('auth.recovery.remembered')}{' '}
      <Link className="text-hoopjot-blue underline" to="/sign-in">
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
