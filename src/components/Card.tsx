import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Use for interactive cards (e.g. activity cards) that lift on hover */
  hover?: boolean;
  /** Use for modal dialogs; no default padding so content can control it */
  asModal?: boolean;
  /** Omit to use default p-6; set to e.g. 'p-8' to override */
  padding?: string;
}

export function Card({ children, className = '', hover, asModal, padding }: CardProps) {
  const base = 'card bg-white rounded-2xl shadow-card border border-stone-100 transition-shadow duration-200';
  const paddingClass = asModal ? '' : padding ?? 'p-6';
  const hoverClass = hover ? 'card-hover hover:shadow-card-hover' : '';
  return (
    <div className={`${base} ${paddingClass} ${hoverClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
