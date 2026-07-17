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
          tracking_number: null,
          customer_name: 'Jane Buyer',
          customer_email: 'buyer@example.com',
          customer_phone: '+2348000000000',
          shipping_address: {
            street: '12 Market Road',
            city: 'Lagos',
            state: 'Lagos State',
            country: 'Nigeria',
          },
        },
      }),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

it('renders the order confirmation page with shipping and tracking context', async () => {
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
      expect(screen.getByText(/12 market road/i)).toBeInTheDocument();
      expect(screen.getByText(/shipment status/i)).toBeInTheDocument();
    });
  });
});
