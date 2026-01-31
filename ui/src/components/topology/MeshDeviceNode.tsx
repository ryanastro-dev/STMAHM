import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  Router,
  Wifi,
  Server,
  Laptop,
  Smartphone,
  Printer,
  HardDrive,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MeshDeviceNode({ data, selected }: NodeProps<any>) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const colors = {
    nodeBg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)',
    nodeBgSelected: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)',
    nodeBorder: isDark ? 'rgba(168, 85, 247, 0.5)' : 'rgba(139, 92, 246, 0.4)',
    nodeBorderSelected: isDark ? '#A855F7' : '#8B5CF6',
    nodeColor: isDark ? '#E9D5FF' : '#581C87',
    shadowDefault: isDark
      ? '0 0 20px rgba(168, 85, 247, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
      : '0 4px 12px rgba(139, 92, 246, 0.15)',
    shadowSelected: isDark
      ? '0 0 30px rgba(168, 85, 247, 0.6), 0 4px 20px rgba(0, 0, 0, 0.3)'
      : '0 0 20px rgba(168, 85, 247, 0.4), 0 4px 16px rgba(0, 0, 0, 0.15)',
    labelBg: isDark ? 'rgba(30, 27, 75, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    labelBorder: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(139, 92, 246, 0.3)',
    labelText: isDark ? '#E9D5FF' : '#4C1D95',
    labelIp: isDark ? '#A78BFA' : '#7C3AED',
  };

  // Get device icon
  const getDeviceIcon = () => {
    const type = data.deviceType?.toUpperCase() || 'UNKNOWN';
    const iconClass = 'w-8 h-8';

    if (type.includes('ROUTER') || type.includes('GATEWAY')) return <Router className={iconClass} />;
    if (type.includes('ACCESS_POINT') || type.includes('WIFI')) return <Wifi className={iconClass} />;
    if (type.includes('SERVER') || type.includes('NAS')) return <Server className={iconClass} />;
    if (type.includes('LAPTOP') || type.includes('PC')) return <Laptop className={iconClass} />;
    if (type.includes('MOBILE') || type.includes('PHONE')) return <Smartphone className={iconClass} />;
    if (type.includes('PRINTER')) return <Printer className={iconClass} />;
    if (type.includes('STORAGE')) return <HardDrive className={iconClass} />;
    if (type.includes('FIREWALL')) return <Shield className={iconClass} />;
    return <HelpCircle className={iconClass} />;
  };

  return (
    <>
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        style={{
          position: 'relative',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Circular node container */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: selected ? colors.nodeBgSelected : colors.nodeBg,
            border: selected
              ? `3px solid ${colors.nodeBorderSelected}`
              : `2px solid ${colors.nodeBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.nodeColor,
            boxShadow: selected ? colors.shadowSelected : colors.shadowDefault,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
        >
          {getDeviceIcon()}
        </div>

        {/* Device label - shows on hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 8,
            padding: '6px 12px',
            borderRadius: 6,
            background: colors.labelBg,
            border: `1px solid ${colors.labelBorder}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: colors.labelText,
              marginBottom: 2,
            }}
          >
            {data.label || 'Unknown'}
          </div>
          <div
            style={{
              fontSize: 10,
              color: colors.labelIp,
              fontFamily: 'monospace',
            }}
          >
            {data.ip}
          </div>
        </motion.div>

        {/* Status indicator dot */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#10B981',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
          }}
        />
      </motion.div>
    </>
  );
}

export default MeshDeviceNode;
