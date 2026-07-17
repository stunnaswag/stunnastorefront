import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CheckoutModal from './CheckoutModal';
import { CartProvider } from '../context/CartContext';

describe('CheckoutModal settings resilience', () => {
  beforeEach(() => {
    vi.stubGlobal('FileReader', class {
      constructor() {
        this.result = 'data:image/png;base64,proof';
      }

      readAsDataURL() {
        if (typeof this.onloadend === 'function') {
          this.onloadend();
        }
      } 
    });

    vi.stubGlobal('fetch', vi.fn((url, options) => {
      if (url === '/api/settings/bank_details') {
        return Promise.resolve({ json: async () => ({ value: '{"bank_name":"Test Bank","account_number":"123456","account_name":"Test Account"}' }) });
      }

      if (url === '/api/settings/delivery_zones') {
        return Promise.resolve({ json: async () => ({ value: [{ name: 'Lagos', fee: 1500 }] }) });
      }

      if (url === '/api/settings/promo_codes') {
        return Promise.resolve({ json: async () => ({ value: [] }) });
      }

      if (url === '/api/checkout/manual') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, orderId: 'ord-123' }),
        });
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

  it('sends the selected shipping fee with the checkout payload', async () => {
    const { container } = render(
      <CartProvider>
        <CheckoutModal
          cart={[]}
          totalAmount={0}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      </CartProvider>
    );

    await screen.findByText(/test bank/i);

    fireEvent.change(screen.getByPlaceholderText(/full name/i), { target: { value: 'Jane Buyer' } });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'buyer@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), { target: { value: '+2348000000000' } });
    fireEvent.change(screen.getByPlaceholderText(/complete delivery address/i), { target: { value: '12 Market Road' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Lagos' } });

    const totalLabel = screen.getByText(/TOTAL AMOUNT DUE:/i);
    expect(totalLabel.parentElement).toHaveTextContent('₦1,500');

    const proofInput = container.querySelector('input[type="file"]');
    const file = new File(['proof'], 'proof.png', { type: 'image/png' });
    fireEvent.change(proofInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit payment for verification/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /submit payment for verification/i }));

    await waitFor(() => {
      const checkoutCall = global.fetch.mock.calls.find(([url]) => url === '/api/checkout/manual');
      expect(checkoutCall).toBeTruthy();

      const [, request] = checkoutCall;
      expect(request.method).toBe('POST');
      expect(request.body).toContain('"shipping_cost":1500');
    });
  });
});
