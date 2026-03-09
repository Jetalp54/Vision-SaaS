import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />
      {/* Offset for the fixed 224px sidebar */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
