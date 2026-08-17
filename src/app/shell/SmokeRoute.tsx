import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function SmokeRoute() {
  const { t } = useTranslation('common');

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-hoopnote-ink">
      <section className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black">{t('smokeTitle')}</h1>
        <p className="mt-4 text-hoopnote-muted">{t('smokeDescription')}</p>
        <Link
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-hoopnote-orange px-5 font-bold text-hoopnote-ink"
          to="/"
        >
          {t('backHome')}
        </Link>
      </section>
    </main>
  );
}

