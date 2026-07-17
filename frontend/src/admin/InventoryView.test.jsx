import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import InventoryView from './InventoryView';

const productList = [
  {
    id: 'prod-1',
    name: 'Trail Jacket',
    base_price: 120,
    collection: 'Winter',
    is_active: true,
    variants: [{ id: 'v-1', size: 'ONE SIZE', color: '', stock: 12 }],
  },
];

describe('InventoryView product deletion', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 1, data: productList }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Product deleted successfully' }),
      });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('issues a DELETE request for a product from the admin inventory list', async () => {
    render(<InventoryView adminKey="admin-key" onAuthError={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/trail jacket/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        '/api/admin/products/prod-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
