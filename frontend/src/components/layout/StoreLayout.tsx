import React from 'react';
import { StoreNavbar } from './StoreNavbar';

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0a09] text-white store-theme font-sans">
      <StoreNavbar />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
