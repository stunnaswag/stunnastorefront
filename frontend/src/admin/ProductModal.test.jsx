import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ProductModal from './ProductModal';
import VariantManager from './VariantManager';

const baseProduct = {
  id: 'prod-1',
  name: 'Trail Jacket',
  description: 'A jacket',
  base_price: 120,
  collection: 'Winter',
  variants: [{ id: 'v-1', size: 'ONE SIZE', color: '', stock: 12 }],
  image_urls: [],
  is_active: true,
};

describe('ProductModal variant refresh behavior', () => {
  it('syncs the modal state when the selected product prop updates after a variant edit', async () => {
    const { container, rerender } = render(
      <ProductModal
        product={baseProduct}
        onClose={() => {}}
        onSuccess={() => {}}
        onRefresh={() => {}}
      />
    );

    const stockInput = container.querySelector('input[name="stock"]');
    expect(stockInput).toBeInTheDocument();
    expect(stockInput.value).toBe('12');

    rerender(
      <ProductModal
        product={{ ...baseProduct, variants: [{ ...baseProduct.variants[0], stock: 22 }] }}
        onClose={() => {}}
        onSuccess={() => {}}
        onRefresh={() => {}}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('input[name="stock"]').value).toBe('22');
    });
  });

  it('uses the default ONE SIZE variant stock instead of summing every variant', () => {
    const productWithDefaultVariant = {
      ...baseProduct,
      variants: [
        { id: 'default-v', size: 'ONE SIZE', color: '', stock: 5 },
        { id: 'size-v', size: 'M', color: 'Black', stock: 7 },
      ],
    };

    const { container } = render(
      <ProductModal
        product={productWithDefaultVariant}
        onClose={() => {}}
        onSuccess={() => {}}
        onRefresh={() => {}}
      />
    );

    const stockInput = container.querySelector('input[name="stock"]');
    expect(stockInput.value).toBe('5');
  });
});

describe('VariantManager delete handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('refreshes and does not show an alert when the delete response has no JSON body', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => '',
    });

    const onVariantUpdate = vi.fn();

    render(
      <VariantManager
        productId="prod-1"
        variants={baseProduct.variants}
        adminKey="admin-1"
        onVariantUpdate={onVariantUpdate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(onVariantUpdate).toHaveBeenCalledTimes(1);
    });

    expect(window.alert).not.toHaveBeenCalled();
  });
});
