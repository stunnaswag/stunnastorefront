import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import useIsMobile from './useIsMobile';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/storefront', label: 'Storefront' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/orders', label: 'Orders' },
];

function SidebarContent({ onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl lowercase tracking-tighter mb-2">stunna</h1>
          <p className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40">SYSADMIN NODE</p>
        </div>
        <nav className="flex flex-col gap-3" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => `rounded-full px-3 py-2 text-left text-[10px] tracking-widest uppercase font-medium transition-colors ${isActive ? 'bg-[#EAEAEA]/10 text-[#EAEAEA]' : 'text-[#EAEAEA]/30 hover:bg-[#EAEAEA]/10 hover:text-[#EAEAEA]/80'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <button onClick={onLogout} className="mt-8 text-left text-[10px] tracking-widest uppercase font-medium text-red-500 hover:opacity-70 transition-opacity">
        TERMINATE SESSION
      </button>
    </div>
  );
}

export default function AdminLayout({ children, onLogout }) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const activeLabel = useMemo(() => {
    const currentItem = navItems.find((item) => location.pathname === item.to || (item.end && location.pathname === '/admin'));
    return currentItem?.label || 'Dashboard';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#2C1414] text-[#EAEAEA] font-sans">
      {isMobile ? (
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-[#EAEAEA]/10 bg-[#2C1414]/95 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#EAEAEA]/40">STUNNA</p>
                <p className="text-sm font-medium text-[#EAEAEA]">{activeLabel}</p>
              </div>
              <button
                aria-label="Open navigation"
                onClick={() => setDrawerOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EAEAEA]/20 bg-[#EAEAEA]/5 text-[#EAEAEA]"
              >
                <Menu size={18} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
            {children}
          </div>

          {drawerOpen && (
            <div className="fixed inset-0 z-30 bg-[#2C1414]/80 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
              <div className="ml-auto flex h-full w-72 flex-col bg-[#2C1414] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl lowercase tracking-tighter">stunna</h2>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#EAEAEA]/40">SYSADMIN NODE</p>
                  </div>
                  <button aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EAEAEA]/20 text-[#EAEAEA]">
                    <X size={18} />
                  </button>
                </div>
                <SidebarContent onLogout={onLogout} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-screen w-full flex-row">
          <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-[#EAEAEA]/10 bg-[#2C1414] p-8 md:p-12">
            <SidebarContent onLogout={onLogout} onNavigate={() => {}} />
          </aside>
          <main className="flex-1 overflow-y-auto p-6 md:p-16">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
