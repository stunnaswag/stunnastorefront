import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import OrdersView from './OrdersView';

const orderList = [
  {
    id: 'ord-123',
    customer_email: 'buyer@example.com',
    customer_name: 'Jane Buyer',
    customer_phone: '+2348000000000',
    shipping_address: {
      street: '12 Market Road',
      city: 'Lagos',
      state: 'Lagos State',
    },
    total_amount: 1200,
    payment_status: 'manual_pending',
    fulfillment_status: 'pending',
    tracking_number: null,
    fulfilled_at: null,
    created_at: '2026-07-17T00:00:00Z',
    payment_proof_url: null,
    order_items: [],
  },
];

describe('OrdersView admin shipping details', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, count: 1, data: orderList }),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the customer's shipping information in the admin orders list", async () => {
    render(<OrdersView adminKey="admin-key" onAuthError={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/12 market road/i)).toBeInTheDocument();
    });
  });

  it('sends a delete request when the admin chooses to delete an order', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 1, data: orderList }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Order deleted successfully' }),
      });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('confirm', vi.fn(() => true));

    render(<OrdersView adminKey="admin-key" onAuthError={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/buyer@example.com/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/orders/ord-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
