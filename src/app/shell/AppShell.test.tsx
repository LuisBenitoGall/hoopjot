import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppRouter } from '../router/AppRouter';
import i18n from '../../i18n/config';

describe('AppShell', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    void i18n.changeLanguage('en');
    window.history.pushState({}, '', '/');
  });

  it('renders the app shell through React Router', () => {
    render(<AppRouter />);

    expect(screen.getByRole('heading', { name: 'Hoopnote' })).toBeInTheDocument();
    expect(screen.getByText('Frontend foundation ready.')).toBeInTheDocument();
  });

  it('can switch the shell language', async () => {
    const user = userEvent.setup();

    render(<AppRouter />);
    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByText('Base frontend lista.')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'es');
  });
});

