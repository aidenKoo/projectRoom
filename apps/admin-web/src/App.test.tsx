
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the login page by default', () => {
    render(<App />);
    expect(screen.getByText('ProjectRoom Admin')).toBeInTheDocument();
  });
});
