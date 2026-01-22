//! Active ARP scanning

use anyhow::{anyhow, Result};
use ipnetwork::Ipv4Network;
use pnet::datalink::{self, Channel};
use pnet::packet::arp::{ArpHardwareTypes, ArpOperations, ArpPacket, MutableArpPacket};
use pnet::packet::ethernet::{EtherTypes, EthernetPacket, MutableEthernetPacket};
use pnet::packet::Packet;
use pnet::util::MacAddr;
use std::collections::HashMap;
use std::net::Ipv4Addr;
use std::sync::Arc;
use std::time::{Duration, Instant};

use crate::config::{ARP_ROUNDS, ARP_TIMEOUT_MS};
use crate::models::InterfaceInfo;
use crate::network::is_special_address;

/// Broadcast MAC address for ARP requests
const BROADCAST_MAC: MacAddr = MacAddr(0xff, 0xff, 0xff, 0xff, 0xff, 0xff);

/// Logs a message to stderr
macro_rules! log_stderr {
    ($($arg:tt)*) => {
        eprintln!("[INFO] {}", format!($($arg)*));
    };
}

/// Creates an ARP request packet
fn create_arp_request(
    source_mac: MacAddr,
    source_ip: Ipv4Addr,
    target_ip: Ipv4Addr,
) -> Vec<u8> {
    let mut buffer = vec![0u8; 42];

    // Build Ethernet frame
    {
        let mut ethernet_packet = MutableEthernetPacket::new(&mut buffer[..14]).unwrap();
        ethernet_packet.set_destination(BROADCAST_MAC);
        ethernet_packet.set_source(source_mac);
        ethernet_packet.set_ethertype(EtherTypes::Arp);
    }

    // Build ARP packet
    {
        let mut arp_packet = MutableArpPacket::new(&mut buffer[14..42]).unwrap();
        arp_packet.set_hardware_type(ArpHardwareTypes::Ethernet);
        arp_packet.set_protocol_type(EtherTypes::Ipv4);
        arp_packet.set_hw_addr_len(6);
        arp_packet.set_proto_addr_len(4);
        arp_packet.set_operation(ArpOperations::Request);
        arp_packet.set_sender_hw_addr(source_mac);
        arp_packet.set_sender_proto_addr(source_ip);
        arp_packet.set_target_hw_addr(MacAddr::zero());
        arp_packet.set_target_proto_addr(target_ip);
    }

    buffer
}

/// Performs Active ARP scan with multiple rounds for maximum detection
pub fn active_arp_scan(
    interface: &InterfaceInfo,
    target_ips: &[Ipv4Addr],
    subnet: &Ipv4Network,
) -> Result<HashMap<Ipv4Addr, MacAddr>> {
    log_stderr!(
        "Phase 1: Active ARP scanning {} hosts ({} rounds, {}ms per round)...",
        target_ips.len(),
        ARP_ROUNDS,
        ARP_TIMEOUT_MS
    );

    // Open datalink channel
    let (mut tx, mut rx) = match datalink::channel(&interface.pnet_interface, Default::default()) {
        Ok(Channel::Ethernet(tx, rx)) => (tx, rx),
        Ok(_) => return Err(anyhow!("Unsupported channel type")),
        Err(e) => {
            let error_msg = format!("{}", e);
            if error_msg.contains("requires") 
                || error_msg.contains("permission")
                || error_msg.contains("Access")
                || error_msg.contains("Npcap")
                || error_msg.contains("WinPcap")
            {
                return Err(anyhow!(
                    "Failed to open network interface for ARP scanning.\n\n\
                     On Windows, this requires Npcap to be installed:\n\
                     1. Download from: https://npcap.com/#download\n\
                     2. Install with 'WinPcap API-compatible Mode' checked\n\
                     3. Run this program as Administrator\n\n\
                     Original error: {}",
                    e
                ));
            }
            return Err(anyhow!("Failed to open datalink channel: {}", e));
        }
    };

    let discovered: Arc<std::sync::Mutex<HashMap<Ipv4Addr, MacAddr>>> = 
        Arc::new(std::sync::Mutex::new(HashMap::new()));
    let scan_start = Instant::now();
    
    let total_timeout = Duration::from_millis(ARP_TIMEOUT_MS * ARP_ROUNDS as u64 + 500);
    
    let discovered_clone = Arc::clone(&discovered);
    let subnet_clone = subnet.clone();

    // Start receiver thread
    let receiver_handle = std::thread::spawn(move || {
        let deadline = Instant::now() + total_timeout;
        
        while Instant::now() < deadline {
            match rx.next() {
                Ok(packet) => {
                    if let Some(ethernet) = EthernetPacket::new(packet) {
                        if ethernet.get_ethertype() == EtherTypes::Arp {
                            if let Some(arp) = ArpPacket::new(ethernet.payload()) {
                                if arp.get_operation() == ArpOperations::Reply {
                                    let sender_ip = arp.get_sender_proto_addr();
                                    let sender_mac = arp.get_sender_hw_addr();

                                    if subnet_clone.contains(sender_ip) && !is_special_address(sender_ip, &subnet_clone) {
                                        let mut map = discovered_clone.lock().unwrap();
                                        if !map.contains_key(&sender_ip) {
                                            map.insert(sender_ip, sender_mac);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                Err(_) => {
                    std::thread::sleep(Duration::from_micros(50));
                }
            }
        }
    });

    std::thread::sleep(Duration::from_millis(10));

    // Send multiple rounds of ARP requests
    for round in 1..=ARP_ROUNDS {
        let round_start = Instant::now();
        
        let discovered_count = discovered.lock().unwrap().len();
        let remaining: Vec<Ipv4Addr> = target_ips.iter()
            .filter(|ip| !discovered.lock().unwrap().contains_key(ip))
            .copied()
            .collect();
        
        log_stderr!(
            "Round {}/{}: Sending {} requests ({} already found)...",
            round, ARP_ROUNDS, remaining.len(), discovered_count
        );
        
        for target_ip in remaining {
            let packet = create_arp_request(interface.mac, interface.ip, target_ip);
            let _ = tx.send_to(&packet, None);
        }
        
        let elapsed = round_start.elapsed();
        let wait_time = Duration::from_millis(ARP_TIMEOUT_MS).saturating_sub(elapsed);
        if wait_time > Duration::ZERO {
            std::thread::sleep(wait_time);
        }
        
        let current_count = discovered.lock().unwrap().len();
        log_stderr!("Round {} complete: {} hosts found so far", round, current_count);
    }

    let _ = receiver_handle.join();

    let map = discovered.lock().unwrap();
    for (ip, mac) in map.iter() {
        log_stderr!("[ARP] Found: {} -> {}", ip, mac);
    }

    log_stderr!(
        "Phase 1 complete: {} hosts found in {:?}",
        map.len(),
        scan_start.elapsed()
    );
    
    Ok(map.clone())
}
