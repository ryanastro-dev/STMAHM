import { useState, useMemo } from 'react';
import { Search, WifiOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScanContext, HostInfo } from '../hooks/useScan';
import DeviceCard from '../components/dashboard/DeviceCard';
import TabFilter from '../components/common/TabFilter';

interface DeviceListProps {
  onDeviceClick?: (device: HostInfo) => void;
}

export default function DeviceList({ onDeviceClick }: DeviceListProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { scanResult, isScanning, tauriAvailable } = useScanContext();
  const devices = scanResult?.active_hosts ?? [];
  
  // Calculate counts for tabs
  const onlineDevices = devices.filter(d => d.response_time_ms !== null && d.response_time_ms !== undefined);
  const warningDevices = devices.filter(d => d.risk_score >= 50);
  const offlineDevices = devices.filter(d => d.response_time_ms === null || d.response_time_ms === undefined);
  
  // Filter devices based on active tab and search
  const filteredDevices = useMemo(() => {
    let filtered = devices;
    
    // Filter by tab
    if (activeTab === 'online') {
      filtered = onlineDevices;
    } else if (activeTab === 'warning') {
      filtered = warningDevices;
    } else if (activeTab === 'offline') {
      filtered = offlineDevices;
    }
    
    // Filter by search
    if (search) {
      filtered = filtered.filter((device) =>
        device.ip.includes(search) ||
        device.mac.toLowerCase().includes(search.toLowerCase()) ||
        device.hostname?.toLowerCase().includes(search.toLowerCase()) ||
        device.vendor?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return filtered;
  }, [devices, activeTab, search, onlineDevices, warningDevices, offlineDevices]);
  
  // Tab configuration
  const tabs = [
    { id: 'all', label: 'All Devices', count: devices.length },
    { id: 'online', label: 'Online', count: onlineDevices.length },
    { id: 'warning', label: 'Warning', count: warningDevices.length },
    { id: 'offline', label: 'Offline', count: offlineDevices.length },
  ];

  // Empty state
  if (!scanResult && !isScanning) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Devices</h1>
          <p className="text-text-muted mt-1">No scan data available</p>
        </div>
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[400px] text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <WifiOff className="w-16 h-16 text-text-muted mb-4" />
          <p className="text-text-muted">
            {tauriAvailable 
              ? 'Click "Start Scan" to discover devices'
              : 'Run with `npm run tauri dev` to enable scanning'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (isScanning && !scanResult) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Devices</h1>
          <p className="text-text-muted mt-1">Scanning network...</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-16 h-16 text-accent-blue animate-spin mb-4" />
          <p className="text-text-muted">Discovering devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IP, MAC, hostname..."
            className="w-full h-10 pl-10 pr-4 bg-bg-tertiary border border-theme rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
          />
        </div>
      </div>

      {/* Tab Filters */}
      <div className="flex items-center justify-between mb-6">
        <TabFilter
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <span className="text-sm text-text-muted">
          {filteredDevices.length} total devices
        </span>
      </div>

      {/* Device Grid */}
      {filteredDevices.length === 0 ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <WifiOff className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-muted">
            {search ? 'No devices match your search' : 'No devices found'}
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredDevices.map((device, index) => (
            <motion.div
              key={device.ip}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <DeviceCard
                device={device}
                onClick={() => onDeviceClick?.(device)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
