import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactElement<{ className?: string }>;
  iconColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  trend?: number | string;
  trendType?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

const iconColorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  orange: 'bg-orange-100 text-orange-600',
};

const trendColorClasses = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-500',
};

export default function MetricCard({ 
  label, 
  value, 
  icon, 
  iconColor = 'blue',
  trend,
  trendType = 'stable',
  subtitle
}: MetricCardProps) {
  const TrendIcon = trendType === 'up' ? TrendingUp : trendType === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon and Label */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${iconColorClasses[iconColor]} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              {label}
            </p>
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Value and Trend */}
      <div className="flex items-end justify-between">
        <div className="text-5xl font-extrabold text-text-primary tracking-tight">
          {value}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trendColorClasses[trendType]}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      {/* Value */}
      <div className="mt-4">
        <p className="text-3xl font-bold text-text-primary">
          {value}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
