'use client';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-sm px-6">
      <div>
        <h1 className="text-sm font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
