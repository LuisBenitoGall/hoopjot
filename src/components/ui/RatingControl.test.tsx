import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RatingControl } from './RatingControl';

describe('RatingControl', () => {
  it('renders accessible rating options and reports changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RatingControl
        getValueLabel={(value) => `${value} of 5`}
        label="Focus clarity"
        maxLabel="Very clear"
        minLabel="Not clear"
        name="clarity"
        onChange={handleChange}
        value={3}
      />,
    );

    expect(screen.getByRole('radio', { name: '3 of 5' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: '5 of 5' }));

    expect(handleChange).toHaveBeenCalledWith(5);
  });
});

