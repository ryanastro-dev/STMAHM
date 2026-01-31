import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronUp, ChevronDown } from 'lucide-react';

interface NetworkEvent {
  id: string;
  timestamp: string;
  type: 'packet' | 'handshake' | 'replication' | 'connection' | 'scan' | 'response';
  source?: string;
  target?: string;
  message: string;
  color: string;
}

interface LiveTrafficMonitorProps {
  visible: boolean;
  isDark: boolean;
  hasScanData?: boolean; // Only generate events if scan has data
}

// Generate simulated network events
function generateEvent(devices: string[]): NetworkEvent {
  const eventTypes = [
    {
      type: 'packet' as const,
      templates: [
        'Packet inbound from {source} [TCP/443]',
        'Packet outbound to {target} [UDP/53]',
        'Data packet from {source} [HTTP/80]',
      ],
      color: '#94A3B8',
    },
    {
      type: 'handshake' as const,
      templates: [
        'Handshake acknowledged by {source}',
        'TLS handshake initiated with {target}',
        'Connection established to {source}',
      ],
      color: '#00D9FF',
    },
    {
      type: 'replication' as const,
      templates: [
        'Data replication started to {target}',
        'Database sync from {source}',
        '{source} backup initiated',
      ],
      color: '#8B5CF6',
    },
    {
      type: 'connection' as const,
      templates: [
        'Replication complete ({time}ms)',
        'Connection closed to {target}',
        'Sync completed successfully',
      ],
      color: '#10B981',
    },
    {
      type: 'scan' as const,
      templates: [
        'Port scan detected from {source}',
        'Network discovery on {target}',
        'ARP request from {source}',
      ],
      color: '#F59E0B',
    },
  ];

  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const template = eventType.templates[Math.floor(Math.random() * eventType.templates.length)];
  
  const source = devices[Math.floor(Math.random() * devices.length)] || '10.0.0.1';
  const target = devices[Math.floor(Math.random() * devices.length)] || '10.0.0.2';
  const time = Math.floor(Math.random() * 200) + 20;

  const message = template
    .replace('{source}', source)
    .replace('{target}', target)
    .replace('{time}', time.toString());

  const now = new Date();
  const timestamp = now.toTimeString().slice(0, 8);

  return {
    id: `${Date.now()}-${Math.random()}`,
    timestamp,
    type: eventType.type,
    source,
    target,
    message,
    color: eventType.color,
  };
}

export default function LiveTrafficMonitor({ visible, isDark, hasScanData = false }: LiveTrafficMonitorProps) {
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Sample device IPs for simulation
  const sampleDevices = [
    'Auth Cluster',
    'Admin Console',
    'Primary Gateway',
    'Web Server 01',
    'Web Server 02',
    'Data Lake',
  ];

  useEffect(() => {
    // Only generate events if we have scan data
    if (!visible || !hasScanData) {
      setEvents([]); // Clear events if no scan data
      return;
    }

    // Add initial events
    const initialEvents = Array.from({ length: 5 }, () => generateEvent(sampleDevices));
    setEvents(initialEvents);

    // Add new event every 2-3 seconds
    const interval = setInterval(() => {
      const newEvent = generateEvent(sampleDevices);
      setEvents((prev) => {
        const updated = [...prev, newEvent];
        // Keep last 50 events
        return updated.slice(-50);
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [visible, hasScanData]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (logContainerRef.current && !isCollapsed) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events, isCollapsed]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      style={{
        borderTop: isDark ? '1px solid rgba(0, 217, 255, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)',
        background: isDark
          ? 'rgba(10, 14, 39, 0.98)'
          : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        boxShadow: isDark
          ? '0 -8px 32px rgba(0, 0, 0, 0.4)'
          : '0 -4px 20px rgba(0, 0, 0, 0.1)',
        flexShrink: 0, // Prevent shrinking
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: isCollapsed
            ? 'none'
            : isDark
            ? '1px solid rgba(0, 217, 255, 0.2)'
            : '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Activity className="w-4 h-4" style={{ color: '#00D9FF' }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? '#00D9FF' : '#0F172A',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Live Traffic Monitor
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: isDark ? '#94A3B8' : '#64748B',
                fontFamily: 'monospace',
              }}
            >
              ETH0: CONNECTED
            </span>
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log Container */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 120, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={logContainerRef}
            style={{
              overflowY: 'auto',
              padding: '8px 16px',
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: 1.6,
            }}
          >
            {events.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: isDark ? '#64748B' : '#94A3B8',
                  fontStyle: 'italic',
                }}
              >
                No network traffic detected yet...
              </div>
            ) : (
              events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: isDark ? '#64748B' : '#94A3B8', minWidth: 70 }}>
                    {event.timestamp}
                  </span>
                  <span style={{ color: event.color }}>{event.message}</span>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
