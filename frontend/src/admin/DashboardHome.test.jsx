import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardHome from './DashboardHome';

describe('DashboardHome analytics view', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/admin/summary') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { totalProducts: 4, activeProducts: 3, openOrders: 2, lowStockAlerts: 1, pendingPayments: 1 } })
        });
      }

      if (url === '/api/admin/analytics') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              range: '30d',
              ordersByDay: [
                { label: 'Jun 01', orders: 1, revenue: 1000 },
                { label: 'Jun 02', orders: 2, revenue: 2200 }
              ],
              paymentMix: [
                { label: 'Success', value: 2 },
                { label: 'Pending', value: 1 }
              ]
            }
          })
        });
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true }) });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders analytics charts for store performance', async () => {
    render(<DashboardHome adminKey="admin-key" onAuthError={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/sales trend/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/payment mix/i)).toBeInTheDocument();
  });
});
