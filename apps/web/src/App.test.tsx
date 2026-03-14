import { fireEvent, render, screen } from '@testing-library/react';

import { App } from './App';

describe('App', () => {
  it('renders the foundation dashboard', () => {
    render(<App />);

    expect(screen.getByText(/ultimate-team orchestration foundation/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace settings/i)).toBeInTheDocument();
    expect(screen.getByText(/provider settings/i)).toBeInTheDocument();
  });

  it('toggles provider status labels', () => {
    render(<App />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Enabled');

    fireEvent.click(buttons[0]);

    expect(buttons[0]).toHaveTextContent('Disabled');
  });
});
