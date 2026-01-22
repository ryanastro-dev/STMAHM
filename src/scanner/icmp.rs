//! ICMP ping scanning

use anyhow::Result;
use pnet::util::MacAddr;
use std::collections::HashMap;
use std::net::{IpAddr, Ipv4Addr};
use std::sync::Arc;
use std::time::Duration;
use surge_ping::{Client, Config, PingIdentifier, PingSequence};
use tokio::sync::{Mutex, Semaphore};
use std::time::Instant;

use crate::config::{MAX_CONCURRENT_PINGS, PING_RETRIES, PING_TIMEOUT};

/// Logs a message to stderr
macro_rules! log_stderr {
    ($($arg:tt)*) => {
        eprintln!("[INFO] {}", format!($($arg)*));
    };
}

/// Logs a warning to stderr
macro_rules! log_warn {
    ($($arg:tt)*) => {
        eprintln!("[WARN] {}", format!($($arg)*));
    };
}

/// Generates a random ping identifier
fn rand_id() -> u16 {
    use std::time::SystemTime;
    let duration = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    ((duration.as_nanos() % 0xFFFF) as u16).wrapping_add(1)
}

/// Pings a single IP address with retries
async fn ping_host_with_retries(client: &Client, ip: Ipv4Addr) -> Option<Duration> {
    let payload = [0u8; 56];

    for attempt in 0..PING_RETRIES {
        let start = Instant::now();
        match client
            .pinger(IpAddr::V4(ip), PingIdentifier(rand_id()))
            .await
            .timeout(PING_TIMEOUT)
            .ping(PingSequence(attempt as u16), &payload)
            .await
        {
            Ok(_) => return Some(start.elapsed()),
            Err(_) => continue,
        }
    }
    None
}

/// Performs ICMP scan on discovered hosts to get response times
pub async fn icmp_scan(
    arp_hosts: &HashMap<Ipv4Addr, MacAddr>,
) -> Result<HashMap<Ipv4Addr, Duration>> {
    if arp_hosts.is_empty() {
        return Ok(HashMap::new());
    }

    log_stderr!(
        "Phase 2: ICMP scanning {} hosts for response times...",
        arp_hosts.len()
    );

    let config = Config::default();
    let client = match Client::new(&config) {
        Ok(c) => Arc::new(c),
        Err(e) => {
            log_warn!("ICMP client unavailable ({}), skipping latency measurement", e);
            return Ok(HashMap::new());
        }
    };

    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT_PINGS));
    let response_times = Arc::new(Mutex::new(HashMap::new()));

    let mut handles = Vec::new();

    for &ip in arp_hosts.keys() {
        let client = Arc::clone(&client);
        let semaphore = Arc::clone(&semaphore);
        let response_times = Arc::clone(&response_times);

        let handle = tokio::spawn(async move {
            let _permit = semaphore.acquire().await.expect("Semaphore closed");

            if let Some(duration) = ping_host_with_retries(&client, ip).await {
                let mut times = response_times.lock().await;
                times.insert(ip, duration);
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        let _ = handle.await;
    }

    let times = response_times.lock().await;
    log_stderr!("Phase 2 complete: {} hosts responded to ICMP", times.len());

    Ok(times.clone())
}
