import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9f9f9', fontFamily: 'sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '30px' }}>
        {children}
      </main>
    </div>
  );
}