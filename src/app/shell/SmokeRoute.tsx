import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function SmokeRoute() {
  const { t } = useTranslation('common');

  return (
    <main className="court-background min-h-screen px-6 py-12 text-hoopjot-ink">
      <section className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black">{t('smokeTitle')}</h1>
        <p className="mt-4 text-hoopjot-muted">{t('smokeDescription')}</p>
        <Link
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-hoopjot-orange px-5 font-bold text-hoopjot-ink"
          to="/"
        >
          {t('backHome')}
        </Link>
      </section>
    </main>
  );
}
