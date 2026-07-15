import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdminLayout from './AdminLayout';

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('AdminLayout responsive navigation', () => {
  it('renders the mobile navigation controls on small screens', () => {
    mockMatchMedia(true);

    render(
      <MemoryRouter>
        <AdminLayout onLogout={() => {}}>
          <div>Dashboard content</div>
        </AdminLayout>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/open navigation/i)).toBeInTheDocument();
    expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0);
  });

  it('keeps the desktop sidebar visible on large screens', () => {
    mockMatchMedia(false);

    render(
      <MemoryRouter>
        <AdminLayout onLogout={() => {}}>
          <div>Dashboard content</div>
        </AdminLayout>
      </MemoryRouter>
    );

    expect(screen.getByText(/sysadmin node/i)).toBeInTheDocument();
  });
});
