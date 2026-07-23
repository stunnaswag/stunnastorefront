import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NewsletterView from './NewsletterView';

describe('NewsletterView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/admin/subscribers') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: [{ id: 'sub-1', email: 'new@example.com', created_at: '2026-07-21T00:00:00Z' }]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });
    }));
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads newsletter subscribers and deletes a selected subscriber', async () => {
    render(<NewsletterView onAuthError={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('new@example.com')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/subscribers/sub-1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('sends a newsletter campaign to the subscriber list', async () => {
    render(<NewsletterView onAuthError={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('new@example.com')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/email subject/i), { target: { value: 'NEW DROP' } });
    fireEvent.change(screen.getByPlaceholderText(/write your message/i), { target: { value: 'NEW PIECES ARE LIVE.' } });
    fireEvent.click(screen.getByRole('button', { name: /send to subscribers/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/newsletter/send',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ subject: 'NEW DROP', message: 'NEW PIECES ARE LIVE.' })
        })
      );
    });
  });
});
