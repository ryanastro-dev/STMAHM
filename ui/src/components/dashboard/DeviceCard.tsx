import { motion } from 'framer-motion';
import { Monitor, Server, Laptop, Smartphone, Printer, Camera, Router, Cpu, Activity, Signal, Wifi } from 'lucide-react';
import { HostInfo } from '../../hooks/useScan';

interface DeviceCardProps {
  device: HostInfo;
  onClick?: () => void;
}

// Device type to icon mapping
const deviceIcons: Record<string, any> = {
  ROUTER: Router,
  SERVER: Server,
  PC: Monitor,
  LAPTOP: Laptop,
  MOBILE: Smartphone,
  PRINTER: Printer,
  CAMERA: Camera,
  SWITCH: Cpu,
};

// Device type to color mapping
const deviceColors: Record<string, string> = {
  ROUTER: '#3B82F6',
  SERVER: '#F59E0B',
  PC: '#6B7280',
  LAPTOP: '#6B7280',
  MOBILE: '#EC4899',
  PRINTER: '#14B8A6',
  CAMERA: '#F97316',
  SWITCH: '#10B981',
};

// Utility: Format relative time
function getRelativeTime(isoTimestamp: string): string {
  const now = new Date();
  const past = new Date(isoTimestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

export default function DeviceCard({ device, onClick }: DeviceCardProps) {
  const Icon = deviceIcons[device.device_type] || Monitor;
  const color = deviceColors[device.device_type] || '#6B7280';
  
  const isOnline = device.response_time_ms !== null && device.response_time_ms !== undefined;
  const isWarning = device.risk_score >= 50;
  
  // Get status badge
  const getStatusBadge = () => {
    if (!isOnline) return { text: 'offline', color: 'bg-status-offline', textColor: 'text-status-offline' };
    if (isWarning) return { text: 'warning', color: 'bg-accent-amber', textColor: 'text-accent-amber' };
    return { text: 'online', color: 'bg-status-online', textColor: 'text-status-online' };
  };
  
  const status = getStatusBadge();
  
  // Format last seen timestamp
  const lastSeenText = device.last_seen 
    ? getRelativeTime(device.last_seen)
    : (isOnline ? 'Just now' : 'Unknown');
  
  return (
    <motion.div
      onClick={onClick}
      className="bg-bg-secondary border border-theme rounded-xl p-5 cursor-pointer transition-all hover:border-accent-blue/50"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Header: Icon + Name + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary text-base truncate">
              {device.hostname || 'Unknown Device'}
            </h3>
            <p className="text-xs text-text-muted">
              {device.device_type.replace('_', ' ')}
            </p>
          </div>
        </div>
        <motion.div 
          className={`px-2 py-1 rounded-md text-xs font-semibold ${status.color}/20 ${status.textColor}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          ● {status.text}
        </motion.div>
      </div>

      {/* IP Address */}
      <div className="mb-4 pb-4 border-b border-theme">
        <p className="text-xs text-text-muted mb-1">IP Address</p>
        <p className="font-mono text-sm text-accent-blue font-medium">{device.ip}</p>
      </div>

      {/* Real Network Metrics */}
      <div className="space-y-3 mb-4">
        {/* Response Time */}
        {device.response_time_ms !== null && device.response_time_ms !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-muted">Response Time</span>
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {device.response_time_ms}ms
            </span>
          </div>
        )}

        {/* Open Ports */}
        {device.open_ports && device.open_ports.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-muted">Open Ports</span>
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {device.open_ports.slice(0, 3).join(', ')}
              {device.open_ports.length > 3 && `+${device.open_ports.length - 3}`}
            </span>
          </div>
        )}

        {/* Vendor */}
        {device.vendor && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Vendor</span>
            <span className="text-xs font-semibold text-text-primary truncate max-w-[180px]">
              {device.vendor}
            </span>
          </div>
        )}

        {/* Risk Score */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Risk Score</span>
          <span 
            className={`text-xs font-semibold ${
              device.risk_score >= 70 ? 'text-accent-red' : 
              device.risk_score >= 40 ? 'text-accent-amber' : 
              'text-accent-green'
            }`}
          >
            {device.risk_score}/100
          </span>
        </div>
      </div>

      {/* Footer: Security Grade & Last Seen */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-theme">
        <div>
          <p className="text-xs text-text-muted mb-1">Security Grade</p>
          <p className={`text-lg font-bold ${
            ['A', 'B'].includes(device.security_grade || '') ? 'text-accent-green' :
            ['C', 'D'].includes(device.security_grade || '') ? 'text-accent-amber' :
            'text-accent-red'
          }`}>
            {device.security_grade || 'N/A'}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-text-muted" />
            <p className="text-xs text-text-muted">Last Seen</p>
          </div>
          <p className="text-xs font-semibold text-text-primary">
            {lastSeenText}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
