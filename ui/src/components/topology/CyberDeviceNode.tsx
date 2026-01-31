import { useState, useEffect } from 'react';
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
  Activity,
  HelpCircle,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// Simulate real-time metrics (in production, fetch from actual system)
function useNodeMetrics(ip: string) {
  const [metrics, setMetrics] = useState(() => ({
    cpu: Math.floor(Math.random() * 60) + 15,  // 15-75%
    mem: Math.floor(Math.random() * 60) + 20,  // 20-80%
    disk: Math.floor(Math.random() * 50) + 10, // 10-60%
    proc: Math.floor(Math.random() * 150) + 50, // 50-200
  }));

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 60) + 15,
        mem: Math.floor(Math.random() * 60) + 20,
        disk: Math.floor(Math.random() * 50) + 10,
        proc: Math.floor(Math.random() * 150) + 50,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [ip]);

  return metrics;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CyberDeviceNode({ data, selected }: NodeProps<any>) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const metrics = useNodeMetrics(data.ip);

  // Theme-aware colors
  const colors = {
    cardBg: isDark ? 'rgba(10, 14, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    cardBorder: isDark ? 'rgba(0, 217, 255, 0.4)' : 'rgba(37, 99, 235, 0.4)',
    cardBorderSelected: isDark ? '#00D9FF' : '#2563EB',
    cardShadow: isDark 
      ? '0 0 20px rgba(0, 217, 255, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    cardShadowSelected: isDark
      ? '0 0 30px rgba(0, 217, 255, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3)'
      : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 16px rgba(0, 0, 0, 0.15)',
    iconBg: isDark ? 'rgba(0, 217, 255, 0.15)' : 'rgba(37, 99, 235, 0.1)',
    iconColor: isDark ? '#00D9FF' : '#2563EB',
    textPrimary: isDark ? '#E0F2FE' : '#0F172A',
    textSecondary: isDark ? '#7DD3FC' : '#64748B',
    textMuted: isDark ? '#38BDF8' : '#94A3B8',
    metricBg: isDark ? 'rgba(30, 27, 75, 0.6)' : 'rgba(241, 245, 249, 0.8)',
    metricBorder: isDark ? 'rgba(0, 217, 255, 0.2)' : 'rgba(203, 213, 225, 0.5)',
    statusGreen: '#10B981',
    barBg: isDark ? 'rgba(30, 27, 75, 0.8)' : 'rgba(226, 232, 240, 0.8)',
    barFill: isDark ? '#00D9FF' : '#2563EB',
  };

  // Get device icon
  const getDeviceIcon = () => {
    const type = data.deviceType?.toUpperCase() || 'UNKNOWN';
    const iconClass = 'w-5 h-5';

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

  // Get metric color based on value
  const getMetricColor = (value: number, threshold: { warning: number; danger: number }) => {
    if (value >= threshold.danger) return '#EF4444'; // Red
    if (value >= threshold.warning) return '#F59E0B'; // Yellow
    return '#10B981'; // Green
  };

  return (
    <>
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <motion.div
        className="cyber-node"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        style={{
          width: 240,
          background: colors.cardBg,
          borderRadius: 8,
          border: selected
            ? `2px solid ${colors.cardBorderSelected}`
            : `1px solid ${colors.cardBorder}`,
          boxShadow: selected
            ? colors.cardShadowSelected
            : colors.cardShadow,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header Section */}
        <div
          style={{
            padding: '12px',
            borderBottom: `1px solid ${colors.metricBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: colors.iconBg,
              border: `1px solid ${colors.cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.iconColor,
            }}
          >
            {getDeviceIcon()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: colors.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {data.label || 'Unknown Device'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: colors.textMuted,
                fontFamily: 'monospace',
                marginTop: 2,
              }}
            >
              {data.ip}
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div
          style={{
            padding: '12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          {/* CPU */}
          <div>
            <div style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4 }}>
              CPU
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: getMetricColor(metrics.cpu, { warning: 60, danger: 80 }),
                fontFamily: 'monospace',
              }}
            >
              {metrics.cpu}%
            </div>
          </div>

          {/* MEM */}
          <div>
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>
              MEM
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: getMetricColor(metrics.mem, { warning: 70, danger: 85 }),
                fontFamily: 'monospace',
              }}
            >
              {metrics.mem}%
            </div>
          </div>

          {/* DISK */}
          <div>
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>
              DISK
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: getMetricColor(metrics.disk, { warning: 70, danger: 90 }),
                fontFamily: 'monospace',
              }}
            >
              {metrics.disk}%
            </div>
          </div>

          {/* PROC */}
          <div>
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>
              PROC
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#00D9FF',
                fontFamily: 'monospace',
              }}
            >
              {metrics.proc}
            </div>
          </div>
        </div>

        {/* Footer - Response Time */}
        {data.responseTime !== undefined && (
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid rgba(0, 217, 255, 0.1)',
              fontSize: 10,
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Activity className="w-3 h-3" />
            <span>{data.responseTime}ms</span>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default CyberDeviceNode;
