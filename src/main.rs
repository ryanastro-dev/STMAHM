//! Network Topology Mapper - Host Discovery (Phase 1)
//!
//! Production-grade network scanner with:
//! - Active ARP scanning (Layer 2)
//! - ICMP ping (latency measurement)
//! - TCP port probing (service detection)

use anyhow::{Context, Result};
use std::net::Ipv4Addr;
use std::time::Instant;

use host_discovery::{
    active_arp_scan, calculate_subnet_ips, find_valid_interface, icmp_scan, tcp_probe_scan,
    HostInfo, InterfaceInfo, ScanResult,
};

/// Logs a message to stderr
macro_rules! log_stderr {
    ($($arg:tt)*) => {
        eprintln!("[INFO] {}", format!($($arg)*));
    };
}

/// Logs an error message to stderr
macro_rules! log_error {
    ($($arg:tt)*) => {
        eprintln!("[ERROR] {}", format!($($arg)*));
    };
}

/// Performs the complete network scan
async fn scan_network(interface: &InterfaceInfo) -> Result<ScanResult> {
    let start_time = Instant::now();
    let (subnet, ips) = calculate_subnet_ips(interface)?;

    log_stderr!("Starting Active ARP + ICMP scan on subnet {}...", subnet);
    log_stderr!("================================================");

    // Phase 1: Active ARP Scan
    let arp_hosts = tokio::task::spawn_blocking({
        let interface = interface.clone();
        let ips = ips.clone();
        let subnet = subnet.clone();
        move || active_arp_scan(&interface, &ips, &subnet)
    })
    .await
    .context("ARP scan task failed")??;

    let arp_count = arp_hosts.len();

    // Phase 2: ICMP scan for response times
    let response_times = icmp_scan(&arp_hosts).await?;
    let icmp_count = response_times.len();

    // Phase 3: TCP probe scan for open ports
    let port_results = tcp_probe_scan(&arp_hosts).await?;

    // Build results (exclude local machine from ARP - we add it separately)
    let mut active_hosts: Vec<HostInfo> = arp_hosts
        .iter()
        .filter(|(ip, _)| **ip != interface.ip)
        .map(|(ip, mac)| {
            let response_time = response_times.get(ip).map(|d| d.as_millis() as u64);
            let open_ports = port_results.get(ip).cloned().unwrap_or_default();
            
            let method = match (response_time.is_some(), !open_ports.is_empty()) {
                (true, true) => "ARP+ICMP+TCP",
                (true, false) => "ARP+ICMP",
                (false, true) => "ARP+TCP",
                (false, false) => "ARP",
            };

            HostInfo {
                ip: ip.to_string(),
                mac: format!("{}", mac),
                response_time_ms: response_time,
                open_ports,
                discovery_method: method.to_string(),
            }
        })
        .collect();

    // Add local machine to results
    active_hosts.push(HostInfo {
        ip: interface.ip.to_string(),
        mac: format!("{}", interface.mac),
        response_time_ms: Some(0),
        open_ports: Vec::new(),
        discovery_method: "LOCAL".to_string(),
    });

    // Sort by IP
    active_hosts.sort_by(|a, b| {
        let ip_a: Ipv4Addr = a.ip.parse().unwrap_or(Ipv4Addr::UNSPECIFIED);
        let ip_b: Ipv4Addr = b.ip.parse().unwrap_or(Ipv4Addr::UNSPECIFIED);
        ip_a.cmp(&ip_b)
    });

    let total_hosts = active_hosts.len();
    let scan_duration = start_time.elapsed();

    log_stderr!("================================================");
    log_stderr!(
        "Scan complete: {} hosts found ({} ARP, {} ICMP responsive) in {:.2}s",
        total_hosts,
        arp_count,
        icmp_count,
        scan_duration.as_secs_f64()
    );

    Ok(ScanResult {
        interface_name: interface.name.clone(),
        local_ip: interface.ip.to_string(),
        local_mac: format!("{}", interface.mac),
        subnet: subnet.to_string(),
        scan_method: "Active ARP + ICMP".to_string(),
        arp_discovered: arp_count,
        icmp_discovered: icmp_count,
        total_hosts,
        scan_duration_ms: scan_duration.as_millis() as u64,
        active_hosts,
    })
}

#[tokio::main]
async fn main() {
    match run().await {
        Ok(result) => {
            println!("{}", serde_json::to_string_pretty(&result).unwrap());
        }
        Err(e) => {
            log_error!("{:#}", e);
            std::process::exit(1);
        }
    }
}

/// Main entry point
async fn run() -> Result<ScanResult> {
    log_stderr!("Network Topology Mapper - Host Discovery v0.3.0");
    log_stderr!("Active ARP + ICMP Scanning Mode");
    log_stderr!("================================================");

    log_stderr!("Detecting network interfaces...");
    let interface = find_valid_interface()?;

    scan_network(&interface).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_result_serialization() {
        let result = ScanResult {
            interface_name: "eth0".to_string(),
            local_ip: "192.168.1.100".to_string(),
            local_mac: "00:11:22:33:44:55".to_string(),
            subnet: "192.168.1.0/24".to_string(),
            scan_method: "Active ARP + ICMP".to_string(),
            arp_discovered: 5,
            icmp_discovered: 3,
            total_hosts: 5,
            scan_duration_ms: 1000,
            active_hosts: vec![
                HostInfo {
                    ip: "192.168.1.1".to_string(),
                    mac: "AA:BB:CC:DD:EE:FF".to_string(),
                    response_time_ms: Some(10),
                    open_ports: vec![80],
                    discovery_method: "ARP+ICMP+TCP".to_string(),
                },
            ],
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"interface_name\":\"eth0\""));
        assert!(json.contains("\"open_ports\":[80]"));
    }
}
