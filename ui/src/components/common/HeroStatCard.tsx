/**
 * HeroStatCard - Large Glassmorphic Metric Display
 * 
 * Features:
 * - Animated number counting
 * - Trend indicators
 * - Inline sparkline charts
 * - Gradient effects
 * - Hover animations
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import GlassCard from './GlassCard';

interface HeroStatCardProps {
  label: string;
  value: number;
  unit?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  variant?: 'default' | 'blue' | 'purple' | 'green';
  sparklineData?: number[];
  delay?: number;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  stable: 'text-slate-400',
};

export default function HeroStatCard({
  label,
  value,
  unit = '',
  icon,
  trend,
  variant = 'default',
  sparklineData,
  delay = 0,
}: HeroStatCardProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <GlassCard
      variant={variant}
      glow
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="p-6 group"
    >
      <div className="space-y-4">
        {/* Header - Icon & Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-slate-700/40 dark:to-slate-800/40 flex items-center justify-center text-indigo-600 dark:text-slate-300 shadow-sm shadow-indigo-100 dark:shadow-none"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {icon}
            </motion.div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {label}
              </p>
            </div>
          </div>
          
          {/* Trend Indicator */}
          {trend && TrendIcon && (
            <div className={`flex items-center gap-1 ${trendColors[trend.direction]}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                {Math.abs(trend.value)}
                {unit}
              </span>
            </div>
          )}
        </div>

        {/* Main Value */}
        <div className="relative">
          <div className="flex items-baseline gap-2">
            <motion.span
              className="text-6xl font-black text-slate-900 dark:text-white tracking-tight"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring' }}
            >
              <CountUp
                end={value}
                duration={2}
                delay={delay}
                separator=","
                decimals={unit === '%' ? 1 : 0}
              />
            </motion.span>
            {unit && (
              <span className="text-2xl font-bold text-slate-400 mb-2">{unit}</span>
            )}
          </div>

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>

        {/* Sparkline (if provided) */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-12 w-full relative overflow-hidden">
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${sparklineData.length * 10} 100`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              {/* Area fill */}
              <path
                d={generateSparklinePath(sparklineData, true)}
                fill={`url(#gradient-${label})`}
                className="text-blue-500"
              />
              
              {/* Line */}
              <path
                d={generateSparklinePath(sparklineData, false)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-400"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// Helper function to generate sparkline SVG path
function generateSparklinePath(data: number[], closePath: boolean): string {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = index * 10 + 5;
    const y = 100 - ((value - min) / range) * 80 - 10;
    return `${x},${y}`;
  });

  let path = `M ${points.join(' L ')}`;
  
  if (closePath) {
    const lastX = (data.length - 1) * 10 + 5;
    path += ` L ${lastX},100 L 5,100 Z`;
  }

  return path;
}
