//! Network Topology Mapper - Host Discovery Library
//!
//! This crate provides network scanning capabilities:
//! - Active ARP scanning for Layer 2 discovery
//! - ICMP ping for latency measurement
//! - TCP port probing for service detection

pub mod config;
pub mod models;
pub mod network;
pub mod scanner;

pub use config::*;
pub use models::*;
pub use network::{find_valid_interface, calculate_subnet_ips, is_special_address};
pub use scanner::{active_arp_scan, icmp_scan, tcp_probe_scan};
