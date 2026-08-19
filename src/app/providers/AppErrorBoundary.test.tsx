import { render, screen } from '@testing-library/react';

import i18n from '../../i18n/config';
import { AppErrorBoundary } from './AppErrorBoundary';

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    void i18n.changeLanguage('en');
  });

  it('renders a recoverable fallback when the app tree throws', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <ThrowingRoute />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Hoopjot needs a reload' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload app' })).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});

function ThrowingRoute(): never {
  throw new Error('Test render failure');
}
