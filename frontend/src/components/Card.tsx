import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section className={`rounded-lg border border-forge-line bg-forge-paper p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}
