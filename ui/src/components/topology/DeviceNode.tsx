import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  Router,
  Server,
  Laptop,
  Smartphone,
  Wifi,
  Printer,
  Camera,
  Cpu,
  HelpCircle,
  MonitorSmartphone,
  Tv,
  Gamepad2,
  HardDrive,
  Shield,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// Device type to icon mapping
const deviceIcons: Record<string, React.ElementType> = {
  ROUTER: Router,
  SWITCH: Cpu,
  ACCESS_POINT: Wifi,
  FIREWALL: Shield,
  SERVER: Server,
  NAS: HardDrive,
  PC: Laptop,
  LAPTOP: Laptop,
  MOBILE: Smartphone,
  TABLET: MonitorSmartphone,
  SMART_TV: Tv,
  IOT_DEVICE: Cpu,
  PRINTER: Printer,
  CAMERA: Camera,
  GAME_CONSOLE: Gamepad2,
  UNKNOWN: HelpCircle,
};

// Device type to color mapping
const deviceColors: Record<string, string> = {
  ROUTER: '#3B82F6',
  SWITCH: '#10B981',
  ACCESS_POINT: '#8B5CF6',
  FIREWALL: '#EF4444',
  SERVER: '#F59E0B',
  NAS: '#F59E0B',
  PC: '#6B7280',
  LAPTOP: '#6B7280',
  MOBILE: '#EC4899',
  TABLET: '#EC4899',
  SMART_TV: '#14B8A6',
  IOT_DEVICE: '#EF4444',
  PRINTER: '#14B8A6',
  CAMERA: '#F97316',
  GAME_CONSOLE: '#8B5CF6',
  UNKNOWN: '#9CA3AF',
};

interface DeviceNodeData {
  label: string;
  ip: string;
  mac?: string;
  deviceType: string;
  isOnline: boolean;
  riskScore?: number;
  vendor?: string;
}

function DeviceNode({ data, selected }: NodeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeData = data as unknown as DeviceNodeData;
  const Icon = deviceIcons[nodeData.deviceType] || HelpCircle;
  const color = deviceColors[nodeData.deviceType] || '#9CA3AF';

  // Theme-aware colors - Professional for BOTH modes
  const bgColor = isDark 
    ? 'rgba(15, 23, 42, 0.85)' 
    : 'rgba(255, 255, 255, 0.98)';
  const borderColor = selected 
    ? color 
    : isDark 
      ? 'rgba(59, 130, 246, 0.3)' 
      : 'rgba(148, 163, 184, 0.25)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const dividerColor = isDark 
    ? 'rgba(59, 130, 246, 0.2)' 
    : 'rgba(148, 163, 184, 0.15)';
  const handleBorder = isDark ? '#020617' : '#F1F5F9';

  return (
    <motion.div
      style={{
        backgroundColor: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '12px 16px',
        minWidth: '160px',
        maxWidth: '200px',
        boxShadow: selected 
          ? isDark
            ? `0 12px 24px rgba(0,0,0,0.5), 0 0 0 3px ${color}40`
            : `0 8px 20px rgba(0,0,0,0.12), 0 0 0 3px ${color}30`
          : isDark 
            ? '0 8px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)' 
            : '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: selected ? 1.05 : 1,
        opacity: 1,
      }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: isDark
          ? `0 16px 28px rgba(0,0,0,0.6), 0 0 0 2px ${color}30`
          : `0 12px 24px rgba(0,0,0,0.12), 0 0 0 2px ${color}20`,
      }}
    >
      {/* Handles for edges */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 10,
          height: 10,
          background: color,
          border: `2px solid ${handleBorder}`,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 10,
          height: 10,
          background: color,
          border: `2px solid ${handleBorder}`,
        }}
      />

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Icon with gradient background */}
        <motion.div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${color}25, ${color}40)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          animate={nodeData.isOnline ? {
            boxShadow: [
              `0 0 0 0 ${color}00`,
              `0 0 0 4px ${color}20`,
              `0 0 0 0 ${color}00`,
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Icon style={{ width: 22, height: 22, color }} />
        </motion.div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: '13px',
              color: textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {nodeData.label}
          </p>
          <p
            style={{
              margin: '2px 0 0 0',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: textMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {nodeData.ip}
          </p>
        </div>

        {/* Status indicator with pulse */}
        <motion.div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: nodeData.isOnline ? '#22C55E' : '#EF4444',
            flexShrink: 0,
          }}
          animate={nodeData.isOnline ? {
            boxShadow: [
              '0 0 0 0 rgba(34, 197, 94, 0.7)',
              '0 0 0 6px rgba(34, 197, 94, 0)',
              '0 0 0 0 rgba(34, 197, 94, 0)',
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Bottom info */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px solid ${dividerColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {nodeData.deviceType.replace('_', ' ')}
        </span>
        {nodeData.riskScore !== undefined && nodeData.riskScore > 0 && (
          <motion.span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: nodeData.riskScore >= 50 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: nodeData.riskScore >= 50 ? '#EF4444' : '#F59E0B',
              fontWeight: 500,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            Risk: {nodeData.riskScore}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

export default DeviceNode;
