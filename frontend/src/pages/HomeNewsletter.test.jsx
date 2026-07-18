import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LoadingProvider } from '../context/LoadingContext';
import Home from './Home';

describe('Home newsletter signup', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      if (url === '/api/newsletter') {
        return {
          ok: true,
          json: async () => ({ success: true, message: 'Subscribed successfully.' }),
        };
      }

      if (url === '/api/settings/hero_image') {
        return {
          ok: true,
          json: async () => ({ value: 'https://www.stunnaswagseason.store/logo/logo.png' }),
        };
      }

      return { ok: true, json: async () => ({}) };
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits the newsletter email to the backend and shows the success state', async () => {
    render(
      <HelmetProvider>
        <LoadingProvider>
          <MemoryRouter>
            <Home />
          </MemoryRouter>
        </LoadingProvider>
      </HelmetProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/newsletter', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }));
    });

    await waitFor(() => {
      expect(screen.getByText(/welcome to the cult/i)).toBeInTheDocument();
    });
  });
});
