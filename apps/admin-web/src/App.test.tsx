
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./firebase.ts', () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(),
  },
}));

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof import('firebase/auth')>('firebase/auth');
  return {
    ...actual,
    onAuthStateChanged: (_auth, callback: (user: any) => void) => {
      callback(null);
      return () => {};
    },
  };
});

describe('App', () => {
  it('renders the login page by default', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText('ProjectRoom Admin')).toBeInTheDocument(),
    );
  });
});
