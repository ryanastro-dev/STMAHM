//! Network Topology Mapper - Host Discovery Library
//!
//! This crate provides network scanning capabilities:
//! - Active ARP scanning for Layer 2 discovery
//! - ICMP ping for latency measurement
//! - TCP port probing for service detection
//! - SNMP enrichment for device details (optional)
//! - SQLite database for historical data storage
//! - Real-time network monitoring
//! - Alert detection and notifications
//! - AI-powered network insights

pub mod alerts;
pub mod config;
pub mod database;
pub mod exports;
pub mod insights;
pub mod logging;
pub mod models;
pub mod monitor;
pub mod network;
pub mod scanner;

pub use config::*;
pub use database::{Database, AlertRecord, AlertSeverity, AlertType, DeviceRecord, NetworkStats, ScanRecord};
pub use models::*;
pub use monitor::{BackgroundMonitor, MonitoringStatus, NetworkEvent};
pub use network::{calculate_risk_score, calculate_subnet_ips, dns_scan, find_valid_interface, infer_device_type, is_local_subnet, is_special_address, lookup_vendor, lookup_vendor_info, DeviceType};
pub use scanner::{active_arp_scan, icmp_scan, guess_os_from_ttl, IcmpResult, snmp_enrich, tcp_probe_scan, SnmpData, SnmpNeighbor};
pub use alerts::{detect_alerts, Alert, has_high_priority_alerts};
pub use insights::{NetworkHealth, DeviceDistribution, VendorDistribution, SecurityReport, Recommendation};
pub use exports::{export_devices_csv, export_hosts_csv, export_topology_json, export_scan_result_json, generate_scan_report_pdf, generate_network_health_pdf};

// Re-export logging macros for use across crate
pub use crate::logging::macros;




