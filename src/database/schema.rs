//! Database schema definitions
//!
//! Creates and manages the SQLite tables

use anyhow::{Context, Result};
use rusqlite::Connection;

/// Create all database tables
pub fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        -- Scans table: stores each scan session
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_time TEXT NOT NULL DEFAULT (datetime('now')),
            interface_name TEXT NOT NULL,
            local_ip TEXT NOT NULL,
            local_mac TEXT NOT NULL,
            subnet TEXT NOT NULL,
            scan_method TEXT NOT NULL,
            arp_discovered INTEGER NOT NULL DEFAULT 0,
            icmp_discovered INTEGER NOT NULL DEFAULT 0,
            total_hosts INTEGER NOT NULL DEFAULT 0,
            duration_ms INTEGER NOT NULL DEFAULT 0
        );

        -- Devices table: unique devices by MAC address
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mac TEXT UNIQUE NOT NULL,
            first_seen TEXT NOT NULL DEFAULT (datetime('now')),
            last_seen TEXT NOT NULL DEFAULT (datetime('now')),
            last_ip TEXT,
            vendor TEXT,
            device_type TEXT,
            hostname TEXT,
            os_guess TEXT,
            custom_name TEXT,
            notes TEXT
        );

        -- Device history: per-scan device status
        CREATE TABLE IF NOT EXISTS device_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER NOT NULL,
            device_id INTEGER NOT NULL,
            ip TEXT NOT NULL,
            response_time_ms INTEGER,
            ttl INTEGER,
            risk_score INTEGER NOT NULL DEFAULT 0,
            security_grade TEXT DEFAULT '',
            is_online INTEGER NOT NULL DEFAULT 1,
            discovery_method TEXT,
            open_ports TEXT,
            FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
        );

        -- Alerts table: notifications and events
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            alert_type TEXT NOT NULL,
            device_id INTEGER,
            device_mac TEXT,
            device_ip TEXT,
            message TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'info',
            is_read INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
        );

        -- CVE Cache table: vulnerability database
        CREATE TABLE IF NOT EXISTS cve_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor TEXT NOT NULL,
            product TEXT,
            cve_id TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL,
            cvss_score REAL,
            published_date TEXT,
            source TEXT DEFAULT 'embedded',
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(vendor, cve_id)
        );

        -- Port Warnings table: insecure port information
        CREATE TABLE IF NOT EXISTS port_warnings (
            port INTEGER PRIMARY KEY,
            service TEXT NOT NULL,
            warning TEXT NOT NULL,
            severity TEXT NOT NULL,
            recommendation TEXT
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(scan_time);
        CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac);
        CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);
        CREATE INDEX IF NOT EXISTS idx_device_history_scan ON device_history(scan_id);
        CREATE INDEX IF NOT EXISTS idx_device_history_device ON device_history(device_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
        CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(is_read) WHERE is_read = 0;
        CREATE INDEX IF NOT EXISTS idx_cve_vendor ON cve_cache(vendor);
        CREATE INDEX IF NOT EXISTS idx_cve_severity ON cve_cache(severity);
        "#,
    )
    .context("Failed to create database tables")?;

    Ok(())
}

/// Drop all tables (for testing/reset)
#[allow(dead_code)]
pub fn drop_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        DROP TABLE IF EXISTS alerts;
        DROP TABLE IF EXISTS device_history;
        DROP TABLE IF EXISTS devices;
        DROP TABLE IF EXISTS scans;
        "#,
    )
    .context("Failed to drop tables")?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_tables() {
        let conn = Connection::open_in_memory().unwrap();
        create_tables(&conn).expect("Failed to create tables");

        // Verify tables exist
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        assert!(tables.contains(&"scans".to_string()));
        assert!(tables.contains(&"devices".to_string()));
        assert!(tables.contains(&"device_history".to_string()));
        assert!(tables.contains(&"alerts".to_string()));
    }
}
