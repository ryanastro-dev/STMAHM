import { useEffect, useState } from 'react';
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
    // Use scan result data directly (real-time!)
    if (scanResult && scanResult.active_hosts) {
      // Map HostInfo to DeviceWithVulns format
      const devicesWithVulns = scanResult.active_hosts.map(host => ({
        id: 0, // Not needed for display
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
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vulnerabilities</h1>
        <p className="text-muted-foreground">
          Security assessment and vulnerability tracking for network devices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{scanResult ? `No devices found${filter !== 'all' ? ' for this filter' : ''}` : 'Run a scan to see device vulnerabilities'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDevices.map(device => (
            <SecurityCard key={device.mac} device={device} />
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
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg border-2 transition-all ${
        active ? 'ring-2 ring-primary' : ''
      } ${colorClasses[color]} hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold">{count}</div>
    </button>
  );
}

// Security Card Component
interface SecurityCardProps {
  device: DeviceWithVulns;
}

function SecurityCard({ device }: SecurityCardProps) {
  const gradeColors = {
    'A': 'text-green-500 bg-green-500/10',
    'B': 'text-blue-500 bg-blue-500/10',
    'C': 'text-yellow-500 bg-yellow-500/10',
    'D': 'text-orange-500 bg-orange-500/10',
    'F': 'text-red-500 bg-red-500/10',
  };

  const grade = device.security_grade || 'N/A';
  const gradeClass = gradeColors[grade as keyof typeof gradeColors] || 'text-gray-500 bg-gray-500/10';

  return (
    <div className="card p-4">
      {/* Device Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold">
            {device.custom_name || device.hostname || device.last_ip}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{device.vendor || 'Unknown Vendor'}</span>
            <span>•</span>
            <span>{device.last_ip}</span>
            <span>•</span>
            <span className="font-mono">{device.mac}</span>
          </div>
        </div>
        <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${gradeClass}`}>
          {grade}
        </div>
      </div>

      {/* Vulnerabilities */}
      {device.vulnerabilities && device.vulnerabilities.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Known Vulnerabilities ({device.vulnerabilities.length})
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
            {device.vulnerabilities.map(vuln => (
              <VulnBadge key={vuln.cve_id} vuln={vuln} />
            ))}
          </div>
        </div>
      )}

      {/* Port Warnings */}
      {device.port_warnings && device.port_warnings.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Port Security Warnings ({device.port_warnings.length})
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
            {device.port_warnings.map(warning => (
              <PortWarningBadge key={warning.port} warning={warning} />
            ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {(!device.vulnerabilities || device.vulnerabilities.length === 0) &&
       (!device.port_warnings || device.port_warnings.length === 0) && (
        <div className="text-center py-4 text-muted-foreground">
          <CheckCircle className="w-10 h-10 mx-auto mb-1.5 text-green-500" />
          <p className="text-sm">No known vulnerabilities or security warnings</p>
        </div>
      )}
    </div>
  );
}

// Vulnerability Badge
function VulnBadge({ vuln }: { vuln: VulnerabilityInfo }) {
  const severityColors = {
    'CRITICAL': 'bg-red-500/10 text-red-500 border-red-500/20',
    'HIGH': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'MEDIUM': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'LOW': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const colorClass = severityColors[vuln.severity as keyof typeof severityColors] || severityColors.LOW;

  return (
    <div className={`p-3 rounded-lg border ${colorClass}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-mono text-xs font-semibold">{vuln.cve_id}</span>
        {vuln.cvss_score && (
          <span className="text-xs font-bold">{vuln.cvss_score.toFixed(1)}</span>
        )}
      </div>
      <p className="text-xs leading-relaxed line-clamp-2">{vuln.description}</p>
    </div>
  );
}

// Port Warning Badge
function PortWarningBadge({ warning }: { warning: PortWarning }) {
  const severityColors = {
    'CRITICAL': 'bg-red-500/10 text-red-500 border-red-500/20',
    'HIGH': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'MEDIUM': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'LOW': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const colorClass = severityColors[warning.severity as keyof typeof severityColors] || severityColors.LOW;

  return (
    <div className={`p-3 rounded-lg border ${colorClass}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-xs">
          Port {warning.port} - {warning.service}
        </span>
        <span className="text-xs font-medium">{warning.severity}</span>
      </div>
      <p className="text-xs leading-relaxed mb-1">{warning.warning}</p>
      {warning.recommendation && (
        <p className="text-xs opacity-70 italic">→ {warning.recommendation}</p>
      )}
    </div>
  );
}
