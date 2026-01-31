import { ReactNode } from 'react';

interface NavSectionProps {
  title: string;
  children: ReactNode;
}

export default function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="nav-section mb-6">
      {/* Section Header */}
      <h3 className="px-4 mb-2 text-xs font-semibold text-text-muted tracking-wider uppercase">
        {title}
      </h3>
      
      {/* Navigation Items */}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}
