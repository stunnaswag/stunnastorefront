import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoadingProvider } from '../context/LoadingContext';
import OrderConfirmation from './OrderConfirmation';

describe('OrderConfirmation page', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'ord-123',
          payment_status: 'manual_pending',
          created_at: '2026-07-17T00:00:00Z',
          total_amount: 1200,
          fulfillment_status: 'pending',
        },
      }),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the order confirmation page without relying on the removed withLoading helper', async () => {
    render(
      <LoadingProvider>
        <MemoryRouter initialEntries={['/order-confirmation/ord-123']}>
          <Routes>
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          </Routes>
        </MemoryRouter>
      </LoadingProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/order status/i)).toBeInTheDocument();
    });
  });
});
