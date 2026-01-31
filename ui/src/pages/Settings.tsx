import { useState, useEffect } from 'react';
import { Save, RefreshCw, Activity, Network, Zap, Shield, Clock, Hash, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { useMonitoring } from '../hooks/useMonitoring';

// Default settings
const DEFAULT_SETTINGS = {
  snmpEnabled: false,
  snmpCommunity: 'public',
  scanInterval: 60,
  tcpPorts: '22, 80, 443, 445, 8080, 3389',
  monitoringEnabled: false,
  monitoringInterval: 60,
};

const SETTINGS_KEY = 'netmapper-settings';

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

function saveSettingsToStorage(settings: typeof DEFAULT_SETTINGS) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
}

// Toggle Switch Component
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-accent-purple' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  // Monitoring hook
  const monitoring = useMonitoring();
  
  const [snmpEnabled, setSnmpEnabled] = useState(DEFAULT_SETTINGS.snmpEnabled);
  const [snmpCommunity, setSnmpCommunity] = useState(DEFAULT_SETTINGS.snmpCommunity);
  const [scanInterval, setScanInterval] = useState(DEFAULT_SETTINGS.scanInterval);
  const [tcpPorts, setTcpPorts] = useState(DEFAULT_SETTINGS.tcpPorts);
  const [monitoringEnabled, setMonitoringEnabled] = useState(DEFAULT_SETTINGS.monitoringEnabled);
  const [monitoringInterval, setMonitoringInterval] = useState(DEFAULT_SETTINGS.monitoringInterval);
  
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demo-mode-enabled') === 'true');
  const [autoUpdateVulnDB, setAutoUpdateVulnDB] = useState(false);
  const [syncRange, setSyncRange] = useState('latest_1000');
  const [vulnDBExpanded, setVulnDBExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  const embeddedCVEs = 150;
  const downloadedCVEs = 0;
  const lastUpdate = null;

  // Load settings on mount
  useEffect(() => {
    const settings = loadSettings();
    setSnmpEnabled(settings.snmpEnabled);
    setSnmpCommunity(settings.snmpCommunity);
    setScanInterval(settings.scanInterval);
    setTcpPorts(settings.tcpPorts);
    setMonitoringEnabled(settings.monitoringEnabled || false);
    setMonitoringInterval(settings.monitoringInterval || 60);
  }, []);

  // Track changes
  useEffect(() => {
    const current = { snmpEnabled, snmpCommunity, scanInterval, tcpPorts, monitoringEnabled, monitoringInterval };
    const saved = loadSettings();
    const changed = JSON.stringify(current) !== JSON.stringify(saved);
    setHasChanges(changed);
  }, [snmpEnabled, snmpCommunity, scanInterval, tcpPorts, monitoringEnabled, monitoringInterval]);

  const handleSave = () => {
    setSaveStatus('saving');
    const settings = { snmpEnabled, snmpCommunity, scanInterval, tcpPorts, monitoringEnabled, monitoringInterval };
    
    setTimeout(() => {
      if (saveSettingsToStorage(settings)) {
        setSaveStatus('saved');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }, 300);
  };

  const handleReset = () => {
    setSnmpEnabled(DEFAULT_SETTINGS.snmpEnabled);
    setSnmpCommunity(DEFAULT_SETTINGS.snmpCommunity);
    setScanInterval(DEFAULT_SETTINGS.scanInterval);
    setTcpPorts(DEFAULT_SETTINGS.tcpPorts);
    setMonitoringEnabled(DEFAULT_SETTINGS.monitoringEnabled);
    setMonitoringInterval(DEFAULT_SETTINGS.monitoringInterval);
    saveSettingsToStorage(DEFAULT_SETTINGS);
    setSaveStatus('saved');
    setHasChanges(false);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSyncDatabase = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('✅ Database sync simulated! Backend integration pending.');
    }, 2000);
  };

  const handleDemoModeToggle = () => {
    const newValue = !demoMode;
    setDemoMode(newValue);
    localStorage.setItem('demo-mode-enabled', newValue.toString());
    // Reload to apply demo mode change
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen flex flex-col">
      {/* Configuration Section */}
      <div className="bg-bg-secondary border border-theme rounded-xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-accent-purple" />
          <h2 className="text-lg font-bold text-text-primary">Configuration</h2>
        </div>
        <p className="text-sm text-text-muted mb-6">Manage scanner behavior and application preferences.</p>

        <div className="space-y-6">
          {/* Scan Settings Card */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-accent-purple" />
              <h3 className="text-sm font-bold text-text-primary">Scan Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2 uppercase">
                  Auto-Scan Interval
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <select
                    value={scanInterval}
                    onChange={(e) => setScanInterval(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 bg-bg-tertiary border border-theme rounded-lg text-text-primary focus:outline-none focus:border-accent-purple transition-colors appearance-none cursor-pointer"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                    <option value={1800}>30 minutes</option>
                    <option value={3600}>1 hour</option>
                  </select>
                </div>
                <p className="text-xs text-text-muted mt-1.5">How often to automatically scan the network.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2 uppercase">
                  TCP Ports to Probe
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                  <textarea
                    value={tcpPorts}
                    onChange={(e) => setTcpPorts(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-bg-tertiary border border-theme rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-accent-purple transition-colors resize-none"
                    rows={2}
                    placeholder="22, 80, 443, 8080"
                  />
                </div>
                <p className="text-xs text-text-muted mt-1.5">Comma-separated list of ports.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SNMP Settings */}
      <div className="bg-bg-secondary border border-theme rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-accent-blue/10 rounded-lg">
              <Network className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">SNMP Settings</h3>
              <p className="text-xs text-text-muted mt-0.5">Enable SNMP to gather detailed device information like system description and uptime.</p>
            </div>
          </div>
          <Toggle enabled={snmpEnabled} onToggle={() => setSnmpEnabled(!snmpEnabled)} />
        </div>
      </div>

      {/* Network Monitoring */}
      <div className="bg-bg-secondary border border-theme rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-accent-purple/10 rounded-lg">
              <Radio className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Network Monitoring</h3>
              <p className="text-xs text-text-muted mt-0.5">Auto-start real-time network monitoring on app launch.</p>
            </div>
          </div>
          <Toggle enabled={monitoringEnabled} onToggle={() => setMonitoringEnabled(!monitoringEnabled)} />
        </div>

        {monitoringEnabled && (
          <div className="pt-4 border-t border-theme space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase">
                Monitoring Interval
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <select
                  value={monitoringInterval}
                  onChange={(e) => setMonitoringInterval(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 bg-bg-tertiary border border-theme rounded-lg text-text-primary focus:outline-none focus:border-accent-purple transition-colors appearance-none cursor-pointer"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                  <option value={1800}>30 minutes</option>
                  <option value={3600}>1 hour</option>
                </select>
              </div>
              <p className="text-xs text-text-muted mt-1.5">How often to scan the network.</p>
            </div>

            {/* Current Status from Hook */}
            <div className="p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-secondary">Current Status:</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  monitoring.status.is_running
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-gray-500/20 text-gray-500'
                }`}>
                  {monitoring.status.is_running ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
              {monitoring.status.is_running && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Scans Completed:</span>
                    <span className="text-text-primary font-medium">{monitoring.status.scan_count}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Devices Online:</span>
                    <span className="text-text-primary font-medium">
                      {monitoring.status.devices_online} / {monitoring.status.devices_total}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Demo Mode */}
      <div className="bg-bg-secondary border border-theme rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-accent-red/10 rounded-lg">
              <Zap className="w-5 h-5 text-accent-red" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Demo Mode</h3>
              <p className="text-xs text-text-muted mt-0.5">Use mock data for demonstration.</p>
            </div>
          </div>
          <Toggle enabled={demoMode} onToggle={handleDemoModeToggle} />
        </div>
      </div>

      {/* Vulnerability Database */}
      <div className="bg-bg-secondary border border-theme rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-accent-red/10 rounded-lg">
              <Shield className="w-5 h-5 text-accent-red" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Vulnerability Database</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-accent-blue px-2 py-1 bg-accent-blue/10 rounded">
              Auto-update
            </span>
            <Toggle enabled={autoUpdateVulnDB} onToggle={() => setAutoUpdateVulnDB(!autoUpdateVulnDB)} />
          </div>
        </div>

        {/* Expandable Section */}
        <button
          onClick={() => setVulnDBExpanded(!vulnDBExpanded)}
          className="w-full flex items-center justify-between text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="text-xs uppercase font-semibold">Database Details</span>
          {vulnDBExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {vulnDBExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t border-theme">
            {/* Sync Range */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase">Sync Range</label>
              <select
                value={syncRange}
                onChange={(e) => setSyncRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-tertiary border border-theme rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple"
              >
                <option value="latest_1000">Latest 1,000 CVEs (~500 KB)</option>
                <option value="latest_5000">Latest 5,000 CVEs (~2.5 MB)</option>
                <option value="last_30_days">Last 30 Days (~200 KB)</option>
                <option value="last_90_days">Last 90 Days (~600 KB)</option>
              </select>
              <p className="text-xs text-text-muted mt-1.5">Larger ranges provide better coverage but take longer to sync.</p>
            </div>

            {/* CVE Statistics */}
            <div className="bg-bg-tertiary rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Embedded CVEs:</span>
                <span className="font-bold text-text-primary">{embeddedCVEs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Downloaded CVEs:</span>
                <span className="font-bold text-text-primary">{downloadedCVEs}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-theme">
                <span className="text-accent-purple font-semibold">Total CVEs:</span>
                <span className="font-bold text-accent-purple">{embeddedCVEs + downloadedCVEs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Last Updated:</span>
                <span className="text-text-muted">{lastUpdate ? new Date(lastUpdate).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>

            {/* Update Button */}
            <button
              onClick={handleSyncDatabase}
              disabled={isSyncing}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm shadow-lg transition-all ${
                isSyncing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-accent-purple to-indigo-600 hover:from-accent-purple/90 hover:to-indigo-600/90 text-white shadow-accent-purple/30'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Updating...' : 'Update Database Now'}
            </button>

            <p className="text-xs text-text-muted text-center">
              💡 Vulnerability database works offline by default.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 border-2 border-theme hover:border-accent-purple rounded-lg text-text-secondary hover:text-text-primary transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">Reset to Defaults</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges && saveStatus === 'idle'}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg transition-all ${
            saveStatus === 'saved'
              ? 'bg-accent-green text-white'
              : hasChanges
              ? 'bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 text-white'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
