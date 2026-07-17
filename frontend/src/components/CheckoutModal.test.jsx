import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CheckoutModal from './CheckoutModal';
import { CartProvider } from '../context/CartContext';

describe('CheckoutModal settings resilience', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/settings/bank_details') {
        return Promise.resolve({ json: async () => ({ value: '{"bank_name":"Test Bank","account_number":"123456","account_name":"Test Account"}' }) });
      }

      if (url === '/api/settings/delivery_zones') {
        return Promise.resolve({ json: async () => ({ value: { name: 'Lagos', fee: 1500 } }) });
      }

      if (url === '/api/settings/promo_codes') {
        return Promise.resolve({ json: async () => ({ value: [] }) });
      }

      return Promise.resolve({ json: async () => ({}) });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders bank details and the checkout form when settings are returned as stringified objects', async () => {
    render(
      <CartProvider>
        <CheckoutModal
          cart={[]}
          totalAmount={0}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      </CartProvider>
    );

    expect(await screen.findByText(/secure checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/test bank/i)).toBeInTheDocument();
    expect(screen.getByText(/test account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
  });
});
