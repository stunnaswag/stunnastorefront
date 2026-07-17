import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';

function CartDrawerHarness() {
  const { setIsCartOpen } = useCart();

  React.useEffect(() => {
    setIsCartOpen(true);
  }, [setIsCartOpen]);

  return <CartDrawer />;
}

describe('CartDrawer tracking shortcut', () => {
  beforeEach(() => {
    localStorage.setItem('stunna_latest_order', 'ord-123');
    localStorage.setItem('stunna_cart', '[]');
  });

  afterEach(() => {
    localStorage.removeItem('stunna_latest_order');
    localStorage.removeItem('stunna_cart');
    vi.restoreAllMocks();
  });

  it('shows a track-order shortcut when a recent order exists', () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <CartDrawerHarness />
        </CartProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/track order/i)).toBeInTheDocument();
  });
});
