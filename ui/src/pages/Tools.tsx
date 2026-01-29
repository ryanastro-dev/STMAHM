import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Activity,
  Search,
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Network,
  Play,
} from 'lucide-react';

type Tab = 'ping' | 'portscan' | 'maclookup';

interface PingResult {
  success: boolean;
  latency_ms: number | null;
  ttl: number | null;
  os_guess: string | null;
  error: string | null;
}

interface PortScanResult {
  port: number;
  is_open: boolean;
  service: string | null;
}

interface VendorLookupResult {
  mac: string;
  vendor: string | null;
  is_randomized: boolean;
}

export default function Tools() {
  const [activeTab, setActiveTab] = useState<Tab>('ping');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">🛠️ Network Tools</h1>
        <p className="text-text-muted">Essential network diagnostic and information utilities</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('ping')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'ping'
              ? 'text-accent-blue border-accent-blue'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          <Activity className="w-5 h-5" />
          Ping Tool
        </button>

        <button
          onClick={() => setActiveTab('portscan')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'portscan'
              ? 'text-accent-blue border-accent-blue'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          <Shield className="w-5 h-5" />
          Port Scanner
        </button>

        <button
          onClick={() => setActiveTab('maclookup')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'maclookup'
              ? 'text-accent-blue border-accent-blue'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          <Network className="w-5 h-5" />
          MAC Lookup
        </button>
      </div>

      {/* Tool Content */}
      <div className="card p-6">
        {activeTab === 'ping' && <PingTool />}
        {activeTab === 'portscan' && <PortScanTool />}
        {activeTab === 'maclookup' && <MACLookupTool />}
      </div>
    </div>
  );
}

// ==================== PING TOOL ====================

function PingTool() {
  const [target, setTarget] = useState('');
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PingResult[]>([]);

  const handlePing = async () => {
    if (!target.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      const pingResults = await invoke<PingResult[]>('ping_host', {
        target: target.trim(),
        count,
      });
      setResults(pingResults);
    } catch (error) {
      console.error('Ping failed:', error);
      alert(`Ping failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const successfulPings = results.filter(r => r.success).length;
  const avgLatency = results.filter(r => r.latency_ms !== null)
    .reduce((sum, r) => sum + (r.latency_ms || 0), 0) / (successfulPings || 1);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Target (IP or Hostname)
          </label>
          <input
            type="text"
            placeholder="e.g., 192.168.1.1 or google.com"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePing()}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Ping Count
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value={1}>1 ping</option>
              <option value={4}>4 pings</option>
              <option value={10}>10 pings</option>
              <option value={20}>20 pings</option>
            </select>
          </div>

          <button
            onClick={handlePing}
            disabled={loading || !target.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Pinging...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Ping
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">Sent</p>
              <p className="text-2xl font-bold text-text-primary">{results.length}</p>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">Received</p>
              <p className="text-2xl font-bold text-accent-green">{successfulPings}</p>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">Lost</p>
              <p className="text-2xl font-bold text-accent-red">{results.length - successfulPings}</p>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">Avg Latency</p>
              <p className="text-2xl font-bold text-accent-blue">{avgLatency.toFixed(1)}ms</p>
            </div>
          </div>

          {/* OS Detection */}
          {results[0]?.os_guess && (
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">Detected OS (from TTL)</p>
              <p className="text-lg font-semibold text-accent-blue">{results[0].os_guess}</p>
            </div>
          )}

          {/* Individual Results */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-secondary">Individual Pings:</h3>
            {results.map((result, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.success ? 'bg-accent-green/10' : 'bg-accent-red/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-accent-green" />
                  ) : (
                    <XCircle className="w-5 h-5 text-accent-red" />
                  )}
                  <span className="text-text-primary">Ping #{i + 1}</span>
                </div>
                <div className="text-text-secondary">
                  {result.success ? (
                    <span>{result.latency_ms?.toFixed(2)}ms (TTL: {result.ttl})</span>
                  ) : (
                    <span className="text-accent-red">{result.error || 'Failed'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PORT SCAN TOOL ====================

function PortScanTool() {
  const [target, setTarget] = useState('');
  const [portInput, setPortInput] = useState('22,80,443,445,3389,8080');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PortScanResult[]>([]);

  const presets = {
    common: '21,22,23,80,443,445,3389,8080',
    web: '80,443,8000,8080,8443',
    database: '1433,3306,5432,27017',
    all: '20,21,22,23,25,53,80,110,143,443,445,3306,3389,5432,8080',
  };

  const handleScan = async () => {
    if (!target.trim() || !portInput.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      const ports = portInput.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
      const scanResults = await invoke<PortScanResult[]>('scan_ports', {
        target: target.trim(),
        ports,
      });
      setResults(scanResults);
    } catch (error) {
      console.error('Port scan failed:', error);
      alert(`Port scan failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const openPorts = results.filter(r => r.is_open).length;

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Target (IP or Hostname)
          </label>
          <input
            type="text"
            placeholder="e.g., 192.168.1.1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Ports (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g., 22,80,443"
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary font-mono focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-text-muted self-center">Quick presets:</span>
          <button
            onClick={() => setPortInput(presets.common)}
            className="px-3 py-1 text-xs bg-bg-tertiary hover:bg-bg-hover text-text-secondary rounded transition-colors"
          >
            Common
          </button>
          <button
            onClick={() => setPortInput(presets.web)}
            className="px-3 py-1 text-xs bg-bg-tertiary hover:bg-bg-hover text-text-secondary rounded transition-colors"
          >
            Web
          </button>
          <button
            onClick={() => setPortInput(presets.database)}
            className="px-3 py-1 text-xs bg-bg-tertiary hover:bg-bg-hover text-text-secondary rounded transition-colors"
          >
            Database
          </button>
          <button
            onClick={() => setPortInput(presets.all)}
            className="px-3 py-1 text-xs bg-bg-tertiary hover:bg-bg-hover text-text-secondary rounded transition-colors"
          >
            All Common
          </button>
        </div>

        <button
          onClick={handleScan}
          disabled={loading || !target.trim() || !portInput.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Start Scan
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">Ports Scanned</p>
              <p className="text-2xl font-bold text-text-primary">{results.length}</p>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-sm text-text-muted mb-1">Open Ports</p>
              <p className="text-2xl font-bold text-accent-green">{openPorts}</p>
            </div>
          </div>

          {/* Port List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-secondary">Scan Results:</h3>
            <div className="space-y-1">
              {results.filter(r => r.is_open).map((result) => (
                <div
                  key={result.port}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent-green/10 border border-accent-green/30"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent-green" />
                    <span className="font-mono text-text-primary">Port {result.port}</span>
                  </div>
                  <span className="text-accent-green font-medium">
                    {result.service || 'Unknown'} - OPEN
                  </span>
                </div>
              ))}
              {results.filter(r => !r.is_open).map((result) => (
                <div
                  key={result.port}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary"
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-text-muted" />
                    <span className="font-mono text-text-muted">Port {result.port}</span>
                  </div>
                  <span className="text-text-muted">Closed</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MAC LOOKUP TOOL ====================

function MACLookupTool() {
  const [mac, setMac] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VendorLookupResult | null>(null);

  const handleLookup = async () => {
    if (!mac.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const lookupResult = await invoke<VendorLookupResult>('lookup_mac_vendor', {
        mac: mac.trim(),
      });
      setResult(lookupResult);
    } catch (error) {
      console.error('Lookup failed:', error);
      alert(`Lookup failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            MAC Address
          </label>
          <input
            type="text"
            placeholder="e.g., 00:1C:B3:00:00:00 or 5a:05:d7:51:07:81"
            value={mac}
            onChange={(e) => setMac(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary font-mono focus:outline-none focus:border-accent-blue transition-colors"
          />
          <p className="text-xs text-text-muted mt-1">
            Format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
          </p>
        </div>

        <button
          onClick={handleLookup}
          disabled={loading || !mac.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Looking up...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Lookup Vendor
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="bg-bg-tertiary rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-text-muted mb-1">MAC Address</p>
              <p className="text-lg font-mono text-text-primary">{result.mac}</p>
            </div>

            {result.is_randomized ? (
              <div className="bg-accent-amber/10 border border-accent-amber/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-amber flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-accent-amber mb-1">Randomized MAC Address</p>
                  <p className="text-sm text-text-secondary">
                    This is a locally administered (randomized/virtual) MAC address, typically used
                    by mobile devices for privacy protection.
                  </p>
                </div>
              </div>
            ) : result.vendor ? (
              <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-4">
                <p className="text-sm text-text-muted mb-1">Manufacturer/Vendor</p>
                <p className="text-xl font-semibold text-accent-green">{result.vendor}</p>
              </div>
            ) : (
              <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4">
                <p className="text-sm text-text-muted mb-1">Vendor</p>
                <p className="text-lg text-accent-red">Unknown</p>
                <p className="text-sm text-text-secondary mt-2">
                  MAC address not found in OUI database
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="bg-bg-tertiary rounded-lg p-4">
        <h4 className="text-sm font-medium text-text-secondary mb-3">Try these examples:</h4>
        <div className="space-y-2">
          <button
            onClick={() => setMac('34:4a:c3:22:6f:90')}
            className="w-full text-left px-3 py-2 bg-bg-primary hover:bg-bg-hover rounded text-sm text-text-primary font-mono transition-colors"
          >
            34:4a:c3:22:6f:90 (TP-Link)
          </button>
          <button
            onClick={() => setMac('5a:05:d7:51:07:81')}
            className="w-full text-left px-3 py-2 bg-bg-primary hover:bg-bg-hover rounded text-sm text-text-primary font-mono transition-colors"
          >
            5a:05:d7:51:07:81 (Randomized MAC)
          </button>
        </div>
      </div>
    </div>
  );
}
