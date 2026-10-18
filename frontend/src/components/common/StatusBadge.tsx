import React from 'react';
import {
  CheckCircle2, Play, Zap, AlertTriangle, AlertCircle,
  HelpCircle, ShieldAlert, Radio
} from 'lucide-react';
import { DroneStatus, StationStatus, MissionStatus, SeverityLevel } from '../../types';

interface StatusBadgeProps {
  status: DroneStatus | StationStatus | MissionStatus | SeverityLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const normStatus = (status || '').toUpperCase();

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = HelpCircle;
  let pulse = false;

  switch (normStatus) {
    case 'AVAILABLE':
    case 'SUCCESS':
    case 'COMPLETED':
    case 'NOMINAL':
    case 'OPERATIONAL':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      break;

    case 'IN_FLIGHT':
    case 'IN_PROGRESS':
    case 'SURVEYING':
    case 'ACTIVE':
      bgClass = 'bg-blue-50 text-blue-800 border-blue-200';
      Icon = Play;
      pulse = true;
      break;

    case 'CHARGING':
      bgClass = 'bg-teal-50 text-teal-800 border-teal-200';
      Icon = Zap;
      pulse = true;
      break;

    case 'OCCUPIED':
      bgClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      Icon = Radio;
      break;

    case 'MAINTENANCE':
    case 'PAUSED':
    case 'WARNING':
    case 'MEDIUM':
    case 'ELEVATED':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = AlertTriangle;
      break;

    case 'OFFLINE':
    case 'CANCELLED':
    case 'CRITICAL':
    case 'HIGH':
      bgClass = 'bg-red-50 text-red-800 border-red-200';
      Icon = normStatus === 'CRITICAL' ? ShieldAlert : AlertCircle;
      break;

    case 'LOW':
    case 'INFO':
    case 'IDLE':
      bgClass = 'bg-sky-50 text-sky-800 border-sky-200';
      Icon = CheckCircle2;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${sizeClasses[size]} ${bgClass} ${className}`}
    >
      {showIcon && (
        <span className="relative flex items-center justify-center">
          {pulse && (
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75 bg-current" />
          )}
          <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        </span>
      )}
      <span>{normStatus.replace(/_/g, ' ')}</span>
    </span>
  );
};
