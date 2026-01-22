//! Subnet calculation and utilities

use anyhow::{Context, Result};
use ipnetwork::Ipv4Network;
use std::net::Ipv4Addr;

use crate::models::InterfaceInfo;

/// Logs a message to stderr
macro_rules! log_stderr {
    ($($arg:tt)*) => {
        eprintln!("[INFO] {}", format!($($arg)*));
    };
}

/// Checks if an IP address is a network or broadcast address
pub fn is_special_address(ip: Ipv4Addr, subnet: &Ipv4Network) -> bool {
    ip == subnet.network() || ip == subnet.broadcast()
}

/// Calculates the subnet range and generates the list of target IPs
pub fn calculate_subnet_ips(interface: &InterfaceInfo) -> Result<(Ipv4Network, Vec<Ipv4Addr>)> {
    let network = Ipv4Network::new(interface.ip, interface.prefix_len)
        .context("Failed to create network from interface IP and prefix")?;

    let subnet = Ipv4Network::new(network.network(), interface.prefix_len)
        .context("Failed to create subnet network")?;

    // Exclude network and broadcast addresses
    let ips: Vec<Ipv4Addr> = subnet
        .iter()
        .filter(|ip| !is_special_address(*ip, &subnet))
        .collect();

    log_stderr!(
        "Calculated subnet: {} with {} scannable hosts",
        subnet,
        ips.len()
    );

    Ok((subnet, ips))
}
