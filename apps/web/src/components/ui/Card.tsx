import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}

export function Card({ children, className = '', glow = false, hover = false }: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-[#222] bg-[#121212] transition-all duration-200',
        glow && 'shadow-[0_0_24px_rgba(99,102,241,0.08)]',
        hover && 'hover:border-[#333] hover:translate-y-[-2px] hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
