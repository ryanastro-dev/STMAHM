/**
 * GlassCard - Glassmorphic Container Component
 * 
 * Features:
 * - Translucent frosted glass effect
 * - Gradient borders
 * - Hover animations
 * - Customizable blur and opacity
 */

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, 'className'> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'blue' | 'purple' | 'green';
  hover?: boolean;
  glow?: boolean;
}

const variantStyles = {
  default: {
    bg: 'bg-gradient-to-br from-white to-slate-50/90 dark:bg-slate-900/75 dark:from-slate-900/75 dark:to-slate-900/75',
    border: 'border-slate-200 dark:border-slate-700/40',
    glow: 'hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-[0_0_24px_rgba(71,85,105,0.2)]',
  },
  blue: {
    bg: 'bg-gradient-to-br from-white to-indigo-50/50 dark:bg-slate-900/75 dark:from-slate-900/75 dark:to-slate-900/75',
    border: 'border-indigo-100 dark:border-indigo-500/30',
    glow: 'hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-[0_0_24px_rgba(79,70,229,0.25)]',
  },
  purple: {
    bg: 'bg-gradient-to-br from-white to-violet-50/50 dark:bg-slate-900/75 dark:from-slate-900/75 dark:to-slate-900/75',
    border: 'border-violet-100 dark:border-violet-500/30',
    glow: 'hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-[0_0_24px_rgba(124,58,237,0.25)]',
  },
  green: {
    bg: 'bg-gradient-to-br from-white to-teal-50/50 dark:bg-slate-900/75 dark:from-slate-900/75 dark:to-slate-900/75',
    border: 'border-teal-100 dark:border-teal-600/30',
    glow: 'hover:shadow-lg hover:shadow-teal-100/50 dark:hover:shadow-[0_0_24px_rgba(13,148,136,0.25)]',
  },
};

export default function GlassCard({
  children,
  className,
  variant = 'default',
  hover = true,
  glow = false,
  ...motionProps
}: GlassCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      className={clsx(
        // Base glass effect
        'relative rounded-2xl border backdrop-blur-xl',
        styles.bg,
        styles.border,
        
        // Shadows - refined for each theme
        'shadow-sm shadow-slate-200/80 dark:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]',
        
        // Hover effects
        hover && 'transition-all duration-300',
        hover && 'hover:-translate-y-1',
        glow && styles.glow,
        
        // Custom classes
        className
      )}
      {...motionProps}
    >
      {/* Gradient overlay for extra depth */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
