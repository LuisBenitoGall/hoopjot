import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './Button';

describe('Button', () => {
  it('uses button semantics and handles activation', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Start focus</Button>);
    await user.click(screen.getByRole('button', { name: 'Start focus' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

