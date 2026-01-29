import { useState, useEffect } from 'react';
import { Save, RefreshCw, Check, AlertCircle } from 'lucide-react';

// Default settings
const DEFAULT_SETTINGS = {
  snmpEnabled: false,
  snmpCommunity: 'public',
  scanInterval: 60,
  tcpPorts: '22,80,443,445,8080,3389',
};

// Storage key
const SETTINGS_KEY = 'netmapper-settings';

// Load settings from localStorage
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

// Save settings to localStorage
function saveSettingsToStorage(settings: typeof DEFAULT_SETTINGS) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
}

export default function Settings() {
  const [snmpEnabled, setSnmpEnabled] = useState(DEFAULT_SETTINGS.snmpEnabled);
  const [snmpCommunity, setSnmpCommunity] = useState(DEFAULT_SETTINGS.snmpCommunity);
  const [scanInterval, setScanInterval] = useState(DEFAULT_SETTINGS.scanInterval);
  const [tcpPorts, setTcpPorts] = useState(DEFAULT_SETTINGS.tcpPorts);
  
  // UI state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Vulnerability database state
  const [autoUpdateVulnDB, setAutoUpdateVulnDB] = useState(false);
  const [syncRange, setSyncRange] = useState('latest_1000');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [embeddedCVEs] = useState(150); // Static count from seed data
  const [downloadedCVEs] = useState(0); // Will be dynamic when backend is implemented
  const [lastUpdate] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = loadSettings();
    setSnmpEnabled(settings.snmpEnabled);
    setSnmpCommunity(settings.snmpCommunity);
    setScanInterval(settings.scanInterval);
    setTcpPorts(settings.tcpPorts);
  }, []);

  // Track changes
  useEffect(() => {
    const current = { snmpEnabled, snmpCommunity, scanInterval, tcpPorts };
    const saved = loadSettings();
    const changed = JSON.stringify(current) !== JSON.stringify(saved);
    setHasChanges(changed);
  }, [snmpEnabled, snmpCommunity, scanInterval, tcpPorts]);

  // Save settings
  const handleSave = () => {
    setSaveStatus('saving');
    const settings = { snmpEnabled, snmpCommunity, scanInterval, tcpPorts };
    
    setTimeout(() => {
      if (saveSettingsToStorage(settings)) {
        setSaveStatus('saved');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 300);
  };

  // Reset to defaults
  const handleReset = () => {
    setSnmpEnabled(DEFAULT_SETTINGS.snmpEnabled);
    setSnmpCommunity(DEFAULT_SETTINGS.snmpCommunity);
    setScanInterval(DEFAULT_SETTINGS.scanInterval);
    setTcpPorts(DEFAULT_SETTINGS.tcpPorts);
    saveSettingsToStorage(DEFAULT_SETTINGS);
    setSaveStatus('saved');
    setHasChanges(false);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Sync vulnerability database (UI-only simulation - backend to be implemented)
  const handleSyncDatabase = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsSyncing(false);
            setSyncProgress(0);
            // Show success message (can be enhanced with toast notification)
            alert(`✅ Sync simulated!\n\nRange: ${syncRange}\n\nNote: Backend NVD API integration not yet implemented.\nThis is a UI-only demo.`);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted mt-1">Configure scanner and application settings</p>
      </div>

      {/* Scan Settings */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Scan Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Auto-scan Interval (seconds)
            </label>
            <input
              type="number"
              value={scanInterval}
              onChange={(e) => setScanInterval(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
              min={10}
              max={3600}
            />
            <p className="text-xs text-text-muted mt-1">
              Set to 0 to disable automatic scanning
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              TCP Ports to Probe
            </label>
            <input
              type="text"
              value={tcpPorts}
              onChange={(e) => setTcpPorts(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-accent-blue transition-colors"
              placeholder="22,80,443,8080"
            />
            <p className="text-xs text-text-muted mt-1">
              Comma-separated list of ports
            </p>
          </div>
        </div>
      </section>

      {/* SNMP Settings */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">SNMP Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Enable SNMP Enrichment</p>
              <p className="text-sm text-text-muted">
                Query devices for additional information via SNMP
              </p>
            </div>
            <button
              onClick={() => setSnmpEnabled(!snmpEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                snmpEnabled ? 'bg-accent-blue' : 'bg-bg-tertiary'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  snmpEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {snmpEnabled && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                SNMP Community String
              </label>
              <input
                type="text"
                value={snmpCommunity}
                onChange={(e) => setSnmpCommunity(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                placeholder="public"
              />
            </div>
          )}
        </div>
      </section>

      {/* Demo Mode Settings */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">🎪 Demo Mode</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Enable Demo Mode
              </label>
              <p className="text-xs text-text-muted">
                Use pre-loaded sample network data for offline demonstrations
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={localStorage.getItem('demo-mode-enabled') === 'true'}
                onChange={(e) => {
                  localStorage.setItem('demo-mode-enabled', e.target.checked.toString());
                  window.location.reload(); // Reload to apply demo mode
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"></div>
            </label>
          </div>

          {/* Demo Mode Info */}
          {localStorage.getItem('demo-mode-enabled') === 'true' && (
            <div className="bg-accent-amber/10 border border-accent-amber/30 rounded-lg p-4">
              <p className="text-sm text-text-secondary mb-2">
                ⚠️ <strong>Demo Mode Active</strong>
              </p>
              <ul className="text-xs text-text-muted space-y-1 ml-4">
                <li>• Network scans return sample data instantly</li>
                <li>• 15 realistic demo devices with vulnerabilities</li>
                <li>• All features work offline</li>
                <li>• Perfect for presentations and demonstrations</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Vulnerability Database Settings */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Vulnerability Database</h2>
        
        <div className="space-y-6">
          {/* Auto-update Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Auto-update from NVD</p>
              <p className="text-sm text-text-muted">
                Automatically sync CVE database with National Vulnerability Database
              </p>
            </div>
            <button
              onClick={() => setAutoUpdateVulnDB(!autoUpdateVulnDB)}
              className={`w-12 h-6 rounded-full transition-colors ${
                autoUpdateVulnDB ? 'bg-accent-blue' : 'bg-bg-tertiary'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  autoUpdateVulnDB ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Sync Range Selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Sync Range
            </label>
            <select
              value={syncRange}
              onChange={(e) => setSyncRange(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="latest_1000">Latest 1,000 CVEs (~500 KB)</option>
              <option value="latest_5000">Latest 5,000 CVEs (~2.5 MB)</option>
              <option value="last_30_days">Last 30 Days (~200 KB)</option>
              <option value="last_90_days">Last 90 Days (~600 KB)</option>
              <option value="last_6_months">Last 6 Months (~2 MB)</option>
              <option value="last_1_year">Last 1 Year (~4 MB)</option>
              <option value="custom">Custom Date Range</option>
            </select>
            <p className="text-xs text-text-muted mt-1">
              Larger ranges provide better coverage but take longer to sync
            </p>
          </div>

          {/* Database Status */}
          <div className="bg-bg-tertiary rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Embedded CVEs:</span>
              <span className="font-mono text-text-primary font-semibold">{embeddedCVEs}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Downloaded CVEs:</span>
              <span className="font-mono text-text-primary font-semibold">{downloadedCVEs}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/10 pt-2">
              <span className="text-text-muted">Total CVEs:</span>
              <span className="font-mono text-accent-blue font-bold">{embeddedCVEs + downloadedCVEs}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Last Updated:</span>
              <span className="text-text-primary">
                {lastUpdate ? new Date(lastUpdate).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>

          {/* Manual Sync Button */}
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isSyncing
                ? 'bg-accent-blue/50 text-white/70 cursor-not-allowed'
                : 'bg-accent-blue hover:bg-accent-blue/80 text-white'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Update Now'}</span>
          </button>
          
          {/* Progress Bar */}
          {isSyncing && syncProgress > 0 && (
            <div className="space-y-1">
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-blue transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-text-muted">
                {syncProgress}% - Fetching CVE data...
              </p>
            </div>
          )}
          
          <p className="text-xs text-text-muted text-center">
            💡 Vulnerability database works offline by default. Online sync is optional.
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handleSave}
          disabled={!hasChanges && saveStatus === 'idle'}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            saveStatus === 'saved' 
              ? 'bg-accent-green text-white'
              : saveStatus === 'error'
              ? 'bg-accent-red text-white'
              : hasChanges
              ? 'bg-accent-blue hover:bg-accent-blue/80 text-white'
              : 'bg-accent-blue/50 text-white/70 cursor-not-allowed'
          }`}
        >
          {saveStatus === 'saving' ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : saveStatus === 'saved' ? (
            <Check className="w-5 h-5" />
          ) : saveStatus === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>
            {saveStatus === 'saving' ? 'Saving...' 
              : saveStatus === 'saved' ? 'Saved!' 
              : saveStatus === 'error' ? 'Error!' 
              : 'Save Settings'}
          </span>
        </button>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-bg-tertiary hover:bg-bg-hover text-text-secondary rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Reset to Defaults</span>
        </button>
        {hasChanges && (
          <span className="text-sm text-accent-amber">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
