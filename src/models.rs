//! Data models for the Network Topology Mapper

use pnet::datalink::NetworkInterface;
use pnet::util::MacAddr;
use serde::Serialize;
use std::net::Ipv4Addr;

/// Result structure for the host discovery scan
#[derive(Debug, Serialize)]
pub struct ScanResult {
    pub interface_name: String,
    pub local_ip: String,
    pub local_mac: String,
    pub subnet: String,
    pub scan_method: String,
    pub arp_discovered: usize,
    pub icmp_discovered: usize,
    pub total_hosts: usize,
    pub scan_duration_ms: u64,
    pub active_hosts: Vec<HostInfo>,
}

/// Information about a discovered host
#[derive(Debug, Serialize, Clone)]
pub struct HostInfo {
    pub ip: String,
    pub mac: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_time_ms: Option<u64>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub open_ports: Vec<u16>,
    pub discovery_method: String,
}

/// Network interface information with MAC address
#[derive(Debug, Clone)]
pub struct InterfaceInfo {
    pub name: String,
    pub ip: Ipv4Addr,
    pub mac: MacAddr,
    pub prefix_len: u8,
    pub pnet_interface: NetworkInterface,
}
