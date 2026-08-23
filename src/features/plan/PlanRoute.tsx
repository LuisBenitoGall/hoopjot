import { useTranslation } from 'react-i18next';

import { AppShell } from '../../app/shell/AppShell';

export function PlanRoute() {
  const { t } = useTranslation('common');

  return (
    <AppShell activeItemId="plan">
      <section className="space-y-3 pt-2">
        <h1 className="text-3xl font-black leading-tight">{t('nav.plan')}</h1>
      </section>
    </AppShell>
  );
}
