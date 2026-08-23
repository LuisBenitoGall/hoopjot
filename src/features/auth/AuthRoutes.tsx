import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAuth } from '../../app/providers/authContext';
import { AuthForm } from './AuthForms';
import { AuthScreenLayout } from './AuthScreenLayout';

export function WelcomeRoute() {
  const { t } = useTranslation('common');

  return (
    <AuthScreenLayout description={t('auth.welcome.description')} title={t('auth.welcome.title')}>
      <div className="space-y-4">
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-hoopjot-orange px-5 py-3 text-sm font-bold text-hoopjot-ink shadow-control motion-safe:transition hover:-translate-y-0.5 hover:bg-[#ff8b1f]"
          to="/sign-up"
        >
          {t('auth.welcome.primaryAction')}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center rounded-control border-2 border-hoopjot-ink bg-hoopjot-surface px-5 py-3 text-sm font-bold text-hoopjot-ink motion-safe:transition hover:-translate-y-0.5 hover:bg-hoopjot-ink hover:text-white"
          to="/sign-in"
        >
          {t('auth.welcome.secondaryAction')}
        </Link>
      </div>
    </AuthScreenLayout>
  );
}

export function SignInRoute() {
  const { t } = useTranslation('common');

  return (
    <AuthScreenLayout description={t('auth.signIn.description')} title={t('auth.signIn.title')}>
      <AuthForm mode="signIn" />
    </AuthScreenLayout>
  );
}

export function SignUpRoute() {
  const { t } = useTranslation('common');

  return (
    <AuthScreenLayout description={t('auth.signUp.description')} title={t('auth.signUp.title')}>
      <AuthForm mode="signUp" />
    </AuthScreenLayout>
  );
}

export function RecoveryRoute() {
  const { state } = useAuth();
  const { t } = useTranslation('common');
  const isUpdatingPassword =
    state.status === 'authenticated' && state.isPasswordRecoverySession;

  return (
    <AuthScreenLayout
      description={
        isUpdatingPassword
          ? t('auth.updatePassword.description')
          : t('auth.recovery.description')
      }
      title={isUpdatingPassword ? t('auth.updatePassword.title') : t('auth.recovery.title')}
    >
      <AuthForm mode={isUpdatingPassword ? 'updatePassword' : 'recovery'} />
    </AuthScreenLayout>
  );
}
