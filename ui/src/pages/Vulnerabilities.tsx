import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useScanContext } from '../hooks/useScan';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';


interface VulnerabilityInfo {
  cve_id: string;
  description: string;
  severity: string;
  cvss_score?: number;
}

interface PortWarning {
  port: number;
  service: string;
  warning: string;
  severity: string;
  recommendation?: string;
}

interface DeviceWithVulns {
  id: number;
  mac: string;
  last_ip: string;
  vendor?: string;
  device_type?: string;
  hostname?: string;
  os_guess?: string;
  custom_name?: string;
  vulnerabilities?: VulnerabilityInfo[];
  port_warnings?: PortWarning[];
  security_grade?: string;
}

export default function Vulnerabilities() {
  const { scanResult } = useScanContext();
  const [devices, setDevices] = useState<DeviceWithVulns[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  useEffect(() => {
    if (scanResult && scanResult.active_hosts) {
      const devicesWithVulns = scanResult.active_hosts.map(host => ({
        id: 0,
        mac: host.mac,
        last_ip: host.ip,
        vendor: host.vendor,
        device_type: host.device_type,
        hostname: host.hostname,
        os_guess: host.os_guess,
        custom_name: undefined,
        vulnerabilities: host.vulnerabilities || [],
        port_warnings: host.port_warnings || [],
        security_grade: host.security_grade || 'N/A',
      }));
      setDevices(devicesWithVulns);
    } else {
      setDevices([]);
    }
  }, [scanResult]);

  // Calculate summary stats
  const stats = {
    critical: devices.filter(d => d.security_grade === 'F').length,
    high: devices.filter(d => d.security_grade === 'D').length,
    medium: devices.filter(d => d.security_grade === 'C').length,
    secure: devices.filter(d => {
      const grade = d.security_grade || '';
      return grade === 'A' || grade === 'B' || grade === '' || grade === 'N/A';
    }).length,
  };

  const filteredDevices = devices.filter(device => {
    if (filter === 'all') return true;
    if (filter === 'critical') return device.security_grade === 'F';
    if (filter === 'high') return device.security_grade === 'D';
    if (filter === 'medium') return device.security_grade === 'C';
    return true;
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Critical"
          count={stats.critical}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
          onClick={() => setFilter('critical')}
          active={filter === 'critical'}
        />
        <SummaryCard
          title="High Risk"
          count={stats.high}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="orange"
          onClick={() => setFilter('high')}
          active={filter === 'high'}
        />
        <SummaryCard
          title="Medium Risk"
          count={stats.medium}
          icon={<Info className="w-5 h-5" />}
          color="yellow"
          onClick={() => setFilter('medium')}
          active={filter === 'medium'}
        />
        <SummaryCard
          title="Secure"
          count={stats.secure}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          onClick={() => setFilter('all')}
          active={filter === 'all'}
        />
      </div>

      {/* Device Security Cards */}
      {filteredDevices.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
          <p className="text-text-muted">
            {scanResult ? `No devices found${filter !== 'all' ? ' for this filter' : ''}` : 'Run a scan to see device vulnerabilities'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDevices.map((device, index) => (
            <motion.div
              key={device.mac}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SecurityCard device={device} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: 'red' | 'orange' | 'yellow' | 'green';
  onClick: () => void;
  active: boolean;
}

function SummaryCard({ title, count, icon, color, onClick, active }: SummaryCardProps) {
  const colorClasses = {
    red: 'bg-accent-red/10 text-accent-red border-accent-red/20 hover:bg-accent-red/15',
    orange: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20 hover:bg-accent-amber/15',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/15',
    green: 'bg-accent-green/10 text-accent-green border-accent-green/20 hover:bg-accent-green/15',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`p-6 rounded-xl border-2 transition-all bg-bg-secondary ${
        active ? 'ring-2 ring-accent-blue' : ''
      } ${colorClasses[color]}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold opacity-80">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold">{count}</div>
    </motion.button>
  );
}

// Security Card Component - Redesigned to match screenshot
interface SecurityCardProps {
  device: DeviceWithVulns;
}

function SecurityCard({ device }: SecurityCardProps) {
  const gradeColors = {
    'A': 'text-accent-green bg-accent-green/10',
    'B': 'text-accent-blue bg-accent-blue/10',
    'C': 'text-yellow-600 dark:text-yellow-500 bg-yellow-500/10',
    'D': 'text-accent-amber bg-accent-amber/10',
    'F': 'text-accent-red bg-accent-red/10',
  };

  const grade = device.security_grade || 'N/A';
  const gradeClass = gradeColors[grade as keyof typeof gradeColors] || 'text-text-muted bg-bg-tertiary';
  
  const hasVulns = device.vulnerabilities && device.vulnerabilities.length > 0;
  const hasWarnings = device.port_warnings && device.port_warnings.length > 0;
  const isSecure = !hasVulns && !hasWarnings;

  return (
    <div className="bg-bg-secondary border border-theme rounded-2xl p-6 hover:border-accent-blue/30 transition-all">
      {/* Device Header */}
      <div className="flex items-start justify-between mb-6">  
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-text-primary mb-1">
            {device.last_ip}
          </h3>
          <p className="text-text-muted text-sm">
            {device.vendor || 'Unknown Vendor'}
          </p>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
            <span>IP: {device.last_ip}</span>
            <span>•</span>
            <span>MAC: {device.mac}</span>
          </div>
        </div>
        
        {/* Security Grade Badge */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0 ${gradeClass}`}>
          {grade}
        </div>
      </div>

      {/* Known Vulnerabilities Section */}
      {hasVulns && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-accent-red" />
            <h4 className="text-sm font-bold text-accent-red uppercase tracking-wide">
              Known Vulnerabilities ({device.vulnerabilities!.length})
            </h4>
          </div>
          
          <div className="space-y-2">
            {device.vulnerabilities!.map(vuln => (
              <div 
                key={vuln.cve_id} 
                className="p-4 rounded-xl bg-accent-red/5 border border-accent-red/10"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-sm font-bold text-accent-red">
                    {vuln.cve_id}
                  </span>
                  {vuln.cvss_score && (
                    <span className="text-sm font-bold text-accent-red bg-accent-red/10 px-2 py-0.5 rounded">
                      CVSS {vuln.cvss_score.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {vuln.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Port Security Warnings Section */}
      {hasWarnings && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-accent-blue" />
            <h4 className="text-sm font-bold text-accent-blue uppercase tracking-wide">
              Port Security Warnings ({device.port_warnings!.length})
            </h4>
          </div>
          
          <div className="space-y-2">
            {device.port_warnings!.map(warning => {
              const severityColors = {
                'LOW': 'bg-accent-blue/5 border-accent-blue/10 text-accent-blue',
                'MEDIUM': 'bg-yellow-500/5 border-yellow-500/10 text-yellow-600 dark:text-yellow-500',
                'HIGH': 'bg-accent-amber/5 border-accent-amber/10 text-accent-amber',
                'CRITICAL': 'bg-accent-red/5 border-accent-red/10 text-accent-red',
              };
              const colorClass = severityColors[warning.severity as keyof typeof severityColors] || severityColors.LOW;
              
              return (
                <div 
                  key={warning.port} 
                  className={`p-4 rounded-xl border ${colorClass}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">
                      Port {warning.port} - {warning.service}
                    </span>
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-current/10">
                      {warning.severity}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {warning.warning}
                    {warning.recommendation && (
                      <> → Use HTTPS (port 443)</>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Clear State */}
      {isSecure && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-accent-green" />
          </div>
          <h4 className="text-lg font-bold text-text-primary mb-1">All Clear</h4>
          <p className="text-sm text-text-muted">
            No known vulnerabilities or security warnings found.
          </p>
        </div>
      )}
    </div>
  );
}
