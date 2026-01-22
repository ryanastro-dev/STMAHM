//! Configuration constants for the Network Topology Mapper

use std::time::Duration;

/// Maximum concurrent ping operations
pub const MAX_CONCURRENT_PINGS: usize = 100;

/// Timeout for each ICMP ping request
pub const PING_TIMEOUT: Duration = Duration::from_secs(2);

/// Number of ping retries per host
pub const PING_RETRIES: u8 = 2;

/// Default subnet prefix length when interface doesn't provide one
pub const DEFAULT_PREFIX_LEN: u8 = 24;

/// ARP scan timeout per round - wait time for replies
pub const ARP_TIMEOUT_MS: u64 = 3000;

/// Number of ARP scan rounds
pub const ARP_ROUNDS: u8 = 3;

/// TCP probe timeout
pub const TCP_PROBE_TIMEOUT: Duration = Duration::from_millis(500);

/// Common ports to probe for host detection
pub const TCP_PROBE_PORTS: &[u16] = &[22, 80, 443, 445, 8080, 3389, 5353, 62078];
