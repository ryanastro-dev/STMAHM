import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Bell,
  AlertTriangle,
  Info,
  ShieldAlert,
  CheckCircle,
  Eye,
  EyeOff,
  Calendar,
  Search,
  RefreshCw,
} from 'lucide-react';

interface AlertRecord {
  id: number;
  created_at: string;
  alert_type: string;
  device_id?: number;
  device_mac?: string;
  device_ip?: string;
  message: string;
  severity: string;
  is_read: boolean;
}

type AlertFilter = 'all' | 'unread' | 'read';
type AlertTypeFilter = 'all' | 'new_device' | 'offline' | 'high_risk' | 'ip_change' | 'suspicious_port';
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info';

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AlertTypeFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load all alerts (we'll fetch all and filter locally)
  const loadAlerts = async () => {
    setLoading(true);
    try {
      // TODO: Backend needs get_all_alerts command, for now use get_unread_alerts
      const result = await invoke<AlertRecord[]>('get_unread_alerts');
      setAlerts(result);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Mark alert as read
  const markAsRead = async (alertId: number) => {
    try {
      await invoke('mark_alert_read', { alertId });
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    for (const id of unreadIds) {
      try {
        await invoke('mark_alert_read', { alertId: id });
      } catch (error) {
        console.error(`Failed to mark alert ${id} as read:`, error);
      }
    }
    setAlerts(alerts.map(a => ({ ...a, is_read: true })));
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    // Status filter
    if (filter === 'unread' && alert.is_read) return false;
    if (filter === 'read' && !alert.is_read) return false;

    // Type filter
    if (typeFilter !== 'all' && alert.alert_type !== typeFilter) return false;

    // Severity filter
    if (severityFilter !== 'all' && alert.severity.toLowerCase() !== severityFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        alert.message.toLowerCase().includes(query) ||
        alert.device_ip?.toLowerCase().includes(query) ||
        alert.device_mac?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Get alert icon
  const getAlertIcon = (type: string, severity: string) => {
    if (severity.toLowerCase() === 'critical') return <ShieldAlert className="w-5 h-5" />;
    if (type === 'new_device') return <Bell className="w-5 h-5" />;
    if (type === 'offline') return <AlertTriangle className="w-5 h-5" />;
    if (type === 'high_risk') return <ShieldAlert className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-accent-red';
      case 'high': return 'text-accent-amber';
      case 'medium': return 'text-accent-yellow';
      case 'low': return 'text-accent-blue';
      default: return 'text-text-muted';
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-accent-red/20 text-accent-red border-accent-red/30',
      high: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
      medium: 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30',
      low: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30',
      info: 'bg-text-muted/20 text-text-muted border-text-muted/30',
    };
    const colorClass = colors[severity.toLowerCase() as keyof typeof colors] || colors.info;
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold border ${colorClass}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Stats
  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.is_read).length,
    critical: alerts.filter(a => a.severity.toLowerCase() === 'critical').length,
    high: alerts.filter(a => a.severity.toLowerCase() === 'high').length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">🔔 Alerts Management</h1>
        <p className="text-text-muted">Monitor and manage network security alerts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Total Alerts</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-accent-blue" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Unread</p>
              <p className="text-2xl font-bold text-accent-amber">{stats.unread}</p>
            </div>
            <EyeOff className="w-8 h-8 text-accent-amber" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Critical</p>
              <p className="text-2xl font-bold text-accent-red">{stats.critical}</p>
            </div>
            <ShieldAlert className="w-8 h-8 text-accent-red" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">High Priority</p>
              <p className="text-2xl font-bold text-accent-yellow">{stats.high}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-accent-yellow" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AlertFilter)}
            className="px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AlertTypeFilter)}
            className="px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
          >
            <option value="all">All Types</option>
            <option value="new_device">New Device</option>
            <option value="offline">Offline</option>
            <option value="high_risk">High Risk</option>
            <option value="ip_change">IP Change</option>
            <option value="suspicious_port">Suspicious Port</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
            className="px-4 py-2.5 bg-bg-tertiary border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={loadAlerts}
              className="flex items-center gap-2 px-4 py-2.5 bg-bg-tertiary hover:bg-bg-hover text-text-secondary rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark all as read"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="hidden lg:inline">Mark All Read</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-8 text-center">
            <RefreshCw className="w-8 h-8 text-accent-blue animate-spin mx-auto mb-2" />
            <p className="text-text-muted">Loading alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckCircle className="w-12 h-12 text-accent-green mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">All Clear!</h3>
            <p className="text-text-muted">
              {alerts.length === 0 
                ? 'No alerts yet. Your network is being monitored.'
                : 'No alerts match your filters.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`card p-6 transition-all hover:border-accent-blue/30 ${
                !alert.is_read ? 'border-l-4 border-l-accent-blue' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 p-3 rounded-lg ${
                  alert.severity.toLowerCase() === 'critical' ? 'bg-accent-red/20' :
                  alert.severity.toLowerCase() === 'high' ? 'bg-accent-amber/20' :
                  alert.severity.toLowerCase() === 'medium' ? 'bg-accent-yellow/20' :
                  'bg-accent-blue/20'
                }`}>
                  <div className={getSeverityColor(alert.severity)}>
                    {getAlertIcon(alert.alert_type, alert.severity)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-text-primary">
                        {alert.alert_type.split('_').map(w => 
                          w.charAt(0).toUpperCase() + w.slice(1)
                        ).join(' ')}
                      </h3>
                      {getSeverityBadge(alert.severity)}
                      {!alert.is_read && (
                        <span className="px-2 py-1 bg-accent-blue/20 text-accent-blue text-xs font-semibold rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Calendar className="w-4 h-4" />
                      {formatDate(alert.created_at)}
                    </div>
                  </div>

                  <p className="text-text-secondary mb-3">{alert.message}</p>

                  {/* Device Info */}
                  {(alert.device_ip || alert.device_mac) && (
                    <div className="flex flex-wrap gap-4 text-sm text-text-muted mb-3">
                      {alert.device_ip && (
                        <span className="flex items-center gap-1">
                          <strong className="text-text-secondary">IP:</strong> {alert.device_ip}
                        </span>
                      )}
                      {alert.device_mac && (
                        <span className="flex items-center gap-1">
                          <strong className="text-text-secondary">MAC:</strong> {alert.device_mac}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!alert.is_read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary hover:bg-bg-hover text-text-secondary rounded text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      {!loading && filteredAlerts.length > 0 && (
        <div className="mt-6 text-center text-sm text-text-muted">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
      )}
    </div>
  );
}
