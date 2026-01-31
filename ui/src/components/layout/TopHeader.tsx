import { Bell, Sun, Moon, Play, CircleStop, Loader2, Circle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { ScanStatus } from '../../hooks/useScan';
import { useTheme } from '../../hooks/useTheme';

interface TopHeaderProps {
  currentPage?: string;
  isScanning?: boolean;
  scanStatus?: ScanStatus;
  onStartScan?: () => void;
  onStopScan?: () => void;
  onNavigateToAlerts?: () => void;
  unreadAlertsCount?: number;
}

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'NetMapper Pro' },
  topology: { title: 'Topology Map', subtitle: 'Network Visualization' },
  devices: { title: 'Device List', subtitle: 'Connected Devices' },
  vulnerabilities: { title: 'Vulnerabilities', subtitle: 'Security Assessment' },
  alerts: { title: 'Alerts', subtitle: 'Notification Center' },
  tools: { title: 'Tools', subtitle: 'Network Utilities' },
  reports: { title: 'Reports', subtitle: 'Export & Analysis' },
  settings: { title: 'Settings', subtitle: 'Configuration' },
};

// Status Pill Component
function StatusPill({ scanStatus }: { scanStatus: ScanStatus }) {
  // Debug log
  useEffect(() => {
    console.log('[StatusPill] Rendering with scanStatus:', scanStatus);
  }, [scanStatus]);

  const getStatusConfig = () => {
    switch (scanStatus) {
      case 'scanning':
        return {
          bgColor: 'bg-orange-500/10',
          textColor: 'text-orange-600',
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Scanning Network...',
        };
      case 'complete':
        return {
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-600',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Scan Complete!',
        };
      case 'ready':
      default:
        return {
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-600',
          icon: <Circle className="w-2 h-2 fill-current" />,
          text: 'System Ready',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${config.bgColor} ${config.textColor}`}
      key={scanStatus}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </motion.div>
  );
}

export default function TopHeader({
  currentPage = 'dashboard',
  isScanning = false,
  scanStatus = 'ready',
  onStartScan,
  onStopScan,
  onNavigateToAlerts,
  unreadAlertsCount = 0,
}: TopHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  // Debug: Log isScanning prop changes
  useEffect(() => {
    console.log('[TopHeader] scanStatus prop received:', scanStatus);
  }, [scanStatus]);

  const handleScanToggle = () => {
    console.log('[TopHeader] handleScanToggle called, current scanStatus:', scanStatus);
    if (isScanning) {
      onStopScan?.();
    } else {
      onStartScan?.();
    }
  };

  const { title, subtitle } = pageInfo[currentPage] || pageInfo.dashboard;

  // Button configuration based on scanStatus
  const getButtonConfig = () => {
    switch (scanStatus) {
      case 'scanning':
        return {
          bgColor: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30',
          icon: <CircleStop className="w-4 h-4" />,
          text: 'Stop Scan',
          disabled: false,
        };
      case 'complete':
        return {
          bgColor: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Done',
          disabled: true, // Disable clicking during complete state
        };
      case 'ready':
      default:
        return {
          bgColor: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30',
          icon: <Play className="w-4 h-4 fill-current" />,
          text: 'Start Scan',
          disabled: false,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <header className="h-16 bg-bg-secondary border-b border-theme flex items-center justify-between px-6 gap-6">
      {/* Left: Page Title & Subtitle */}
      <div className="flex flex-col">
        <motion.h1
          className="text-2xl font-bold text-text-primary"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          key={title}
        >
          {title}
        </motion.h1>
        <motion.p
          className="text-sm text-text-muted"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          key={subtitle}
        >
          {subtitle}
        </motion.p>
      </div>

      {/* Right: Status Pill + Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Status Indicator Pill */}
        <StatusPill scanStatus={scanStatus} />

        {/* Theme Toggle */}
        <motion.button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg hover:bg-bg-hover transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-text-secondary" />
          ) : (
            <Sun className="w-5 h-5 text-text-secondary" />
          )}
        </motion.button>

        {/* Notification Bell */}
        <motion.button
          onClick={onNavigateToAlerts}
          className="relative p-2.5 rounded-lg hover:bg-bg-hover transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-text-secondary" />
          {unreadAlertsCount > 0 && (
            <motion.span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-accent-red text-white text-xs font-bold rounded-full px-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
            </motion.span>
          )}
        </motion.button>

        {/* Scan Control Button */}
        <motion.button
          onClick={handleScanToggle}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white transition-all ${buttonConfig.bgColor}`}
          whileHover={{ scale: buttonConfig.disabled ? 1 : 1.05, y: buttonConfig.disabled ? 0 : -1 }}
          whileTap={{ scale: buttonConfig.disabled ? 1 : 0.95 }}
          disabled={buttonConfig.disabled || (!onStartScan && !onStopScan)}
        >
          {buttonConfig.icon}
          <span>{buttonConfig.text}</span>
        </motion.button>
      </div>
    </header>
  );
}
