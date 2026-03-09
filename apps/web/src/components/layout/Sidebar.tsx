'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/app',          label: 'Dashboard',  icon: '⚡' },
  { href: '/app/history',  label: 'History',    icon: '🕒' },
  { href: '/app/settings', label: 'Settings',   icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-[#222] bg-[#0a0a0a] fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1a1a1a]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-900/40">
          V
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">VisionPrompt</p>
          <p className="text-[10px] text-gray-600 mt-0.5">AI Image Engine</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-indigo-600/15 text-white border-l-2 border-indigo-500 pl-[10px]'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5 border-l-2 border-transparent',
              ].join(' ')}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Health link */}
      <div className="px-3 pb-3 border-t border-[#1a1a1a] pt-3">
        <Link
          href="/health"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          System Status
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-700 hover:text-gray-500 transition-colors mt-1"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
