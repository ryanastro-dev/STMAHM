//! Network Topology Mapper - Host Discovery Library
//!
//! This crate provides network scanning capabilities:
//! - Active ARP scanning for Layer 2 discovery
//! - ICMP ping for latency measurement
//! - TCP port probing for service detection
//! - SNMP enrichment for device details (optional)

pub mod config;
pub mod models;
pub mod network;
pub mod scanner;

pub use config::*;
pub use models::*;
pub use network::{calculate_subnet_ips, find_valid_interface, is_local_subnet, is_special_address, lookup_vendor};
pub use scanner::{active_arp_scan, icmp_scan, snmp_enrich, tcp_probe_scan, SnmpData, SnmpNeighbor};
