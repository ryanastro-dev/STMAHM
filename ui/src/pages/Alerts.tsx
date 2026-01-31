import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  Info,
  ShieldAlert,
  CheckCircle,
  Eye,
  Clock,
  Trash2,
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

type AlertFilter = 'all' | 'critical' | 'warnings' | 'info' | 'unread';

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertFilter>('all');

  // Load alerts
  const loadAlerts = async () => {
    setLoading(true);
    try {
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

  // Clear all alerts
  const clearAll = () => {
    setAlerts([]);
  };

  // Stats
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity.toLowerCase() === 'critical').length,
    warnings: alerts.filter(a => 
      a.severity.toLowerCase() === 'high' || 
      a.severity.toLowerCase() === 'medium'
    ).length,
    unread: alerts.filter(a => !a.is_read).length,
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'critical') return alert.severity.toLowerCase() === 'critical';
    if (filter === 'warnings') return ['high', 'medium'].includes(alert.severity.toLowerCase());
    if (filter === 'info') return ['low', 'info'].includes(alert.severity.toLowerCase());
    if (filter === 'unread') return !alert.is_read;
    return true;
  });

  // Get alert icon and color
  const getAlertConfig = (severity: string) => {
    const sev = severity.toLowerCase();
    if (sev === 'critical') {
      return { 
        icon: <ShieldAlert className="w-5 h-5" />, 
        color: 'text-accent-red', 
        bg: 'bg-accent-red/10',
        border: 'border-l-accent-red'
      };
    }
    if (sev === 'high' || sev === 'medium') {
      return { 
        icon: <AlertTriangle className="w-5 h-5" />, 
        color: 'text-accent-amber', 
        bg: 'bg-accent-amber/10',
        border: 'border-l-accent-amber'
      };
    }
    return { 
      icon: <Info className="w-5 h-5" />, 
      color: 'text-accent-blue', 
      bg: 'bg-accent-blue/10',
      border: 'border-l-accent-blue'
    };
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

  return (
    <div className="p-6 lg:p-8">
      {/* Stats Grid - 4 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 border border-accent-blue/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold uppercase tracking-wide text-accent-blue">Total Alerts</span>
            <Bell className="w-6 h-6 text-accent-blue" />
          </div>
          <p className="text-4xl font-bold text-accent-blue">{stats.total}</p>
        </motion.div>

        {/* Critical */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-accent-red/20 to-accent-red/5 border border-accent-red/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold uppercase tracking-wide text-accent-red">Critical</span>
            <ShieldAlert className="w-6 h-6 text-accent-red" />
          </div>
          <p className="text-4xl font-bold text-accent-red">{stats.critical}</p>
        </motion.div>

        {/* Warnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-accent-amber/20 to-accent-amber/5 border border-accent-amber/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold uppercase tracking-wide text-accent-amber">Warnings</span>
            <AlertTriangle className="w-6 h-6 text-accent-amber" />
          </div>
          <p className="text-4xl font-bold text-accent-amber">{stats.warnings}</p>
        </motion.div>

        {/* Unread */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-purple/5 border border-accent-purple/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold uppercase tracking-wide text-accent-purple">Unread</span>
            <Eye className="w-6 h-6 text-accent-purple" />
          </div>
          <p className="text-4xl font-bold text-accent-purple">{stats.unread}</p>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-bg-secondary border border-theme rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Tab Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-text-primary text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'critical'
                  ? 'bg-accent-red text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('warnings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'warnings'
                  ? 'bg-accent-amber text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              Warnings
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'info'
                  ? 'bg-accent-blue text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-accent-purple text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all read
            </button>
            <button
              onClick={clearAll}
              disabled={alerts.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-bg-secondary border border-theme rounded-xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-muted">Loading alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-bg-secondary border border-theme rounded-xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-accent-green mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">All Clear!</h3>
            <p className="text-text-muted">
              {alerts.length === 0 
                ? 'No alerts yet. Your network is being monitored.'
                : 'No alerts match your current filter.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => {
            const config = getAlertConfig(alert.severity);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-bg-secondary border border-theme rounded-xl overflow-hidden hover:border-accent-blue/30 transition-all border-l-4 ${config.border}`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg ${config.bg} ${config.color} shrink-0`}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-text-primary">
                            {alert.alert_type.split('_').map(w => 
                              w.charAt(0).toUpperCase() + w.slice(1)
                            ).join(' ')}
                          </h3>
                          {!alert.is_read && (
                            <span className="px-2 py-0.5 bg-accent-blue/20 text-accent-blue text-xs font-bold rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(alert.created_at)}
                        </div>
                      </div>

                      <p className="text-text-secondary text-sm mb-3 leading-relaxed">
                        {alert.message}
                      </p>

                      {/* Device Info */}
                      {(alert.device_ip || alert.device_mac) && (
                        <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                          {alert.device_ip && (
                            <span className="font-mono bg-bg-tertiary px-2 py-1 rounded">
                              {alert.device_ip}
                            </span>
                          )}
                          {alert.device_mac && (
                            <span className="font-mono bg-bg-tertiary px-2 py-1 rounded">
                              {alert.device_mac}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action */}
                      {!alert.is_read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary rounded-lg text-sm transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
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
