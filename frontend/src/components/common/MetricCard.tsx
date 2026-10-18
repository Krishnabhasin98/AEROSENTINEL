import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'critical' | 'teal';
  trend?: string;
  trendPositive?: boolean;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  trendPositive,
  onClick
}) => {
  const variantStyles = {
    default: {
      border: 'border-aeroborder',
      iconBg: 'bg-slate-100 text-navy',
      accent: 'text-aerotext-primary'
    },
    primary: {
      border: 'border-blue-100',
      iconBg: 'bg-blue-50 text-aeroblue',
      accent: 'text-aeroblue'
    },
    success: {
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50 text-status-success',
      accent: 'text-status-success'
    },
    warning: {
      border: 'border-amber-100',
      iconBg: 'bg-amber-50 text-status-warning',
      accent: 'text-status-warning'
    },
    critical: {
      border: 'border-red-100',
      iconBg: 'bg-red-50 text-status-critical',
      accent: 'text-status-critical'
    },
    teal: {
      border: 'border-teal-100',
      iconBg: 'bg-tealaccent-light text-tealaccent',
      accent: 'text-tealaccent'
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border ${style.border} p-5 shadow-card hover:shadow-panel transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-slate-300' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider text-aerotext-secondary uppercase">
          {title}
        </p>
        <div className={`p-2.5 rounded-lg ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-aerotext-primary font-mono">
          {value}
        </h3>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trendPositive ? 'text-status-success' : 'text-status-critical'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-aerotext-secondary flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
