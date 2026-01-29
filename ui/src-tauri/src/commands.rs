//! Tauri commands that bridge the UI to the Rust scanner
//!
//! These commands are callable from the React frontend via `invoke()`.

use std::sync::Mutex;
use std::time::Instant;
use tokio::sync::Mutex as TokioMutex;
use tauri::Emitter;

// Re-export types from the scanner library
use host_discovery::{
    ScanResult, HostInfo,
    find_valid_interface, calculate_subnet_ips,
    active_arp_scan, icmp_scan, tcp_probe_scan, dns_scan,
    lookup_vendor_info, infer_device_type, calculate_risk_score,
    guess_os_from_ttl,
    // Database
    Database, DeviceRecord, ScanRecord, NetworkStats, AlertRecord,
    database::queries::{self, lookup_port_warnings},
    // Monitoring
    BackgroundMonitor, MonitoringStatus, NetworkEvent,
    // Exports
    export_devices_csv, export_hosts_csv, export_topology_json, 
    export_scan_result_json, generate_scan_report_pdf, generate_network_health_pdf,
    // Insights
    SecurityReport,
    insights::{calculate_security_grade, filter_vulnerabilities_by_context},
};


/// Application state holding database connection
pub struct AppState {
    pub db: Mutex<Database>,
}

impl AppState {
    pub fn new() -> Result<Self, String> {
        let db_path = Database::default_path();
        let db = Database::new(db_path)
            .map_err(|e| format!("Failed to initialize database: {}", e))?;
        Ok(Self { db: Mutex::new(db) })
    }
}

/// Monitoring state holding background monitor
pub struct MonitorState {
    pub monitor: TokioMutex<BackgroundMonitor>,
}

impl MonitorState {
    pub fn new() -> Self {
        Self {
            monitor: TokioMutex::new(BackgroundMonitor::new()),
        }
    }
}


/// Perform a network scan and save to database
/// 
/// This calls the existing host-discovery scanner library.
#[tauri::command]
pub async fn scan_network(state: tauri::State<'_, AppState>) -> Result<ScanResult, String> {
    let start = Instant::now();
    
    // Find a valid network interface
    let interface = find_valid_interface()
        .map_err(|e| format!("Failed to find network interface: {}", e))?;

    // Calculate subnet IPs
    let (subnet, ips) = calculate_subnet_ips(&interface)
        .map_err(|e| format!("Failed to calculate subnet: {}", e))?;

    // Run ARP scan (blocking, so we spawn it)
    let arp_hosts = {
        let interface_clone = interface.clone();
        let ips_clone = ips.clone();
        let subnet_clone = subnet.clone();
        
        tokio::task::spawn_blocking(move || {
            active_arp_scan(&interface_clone, &ips_clone, &subnet_clone)
        })
        .await
        .map_err(|e| format!("ARP scan task failed: {}", e))?
        .map_err(|e| format!("ARP scan failed: {}", e))?
    };

    let arp_count = arp_hosts.len();

    // Run ICMP and TCP scans in parallel
    let (response_times, port_results) = tokio::join!(
        icmp_scan(&arp_hosts),
        tcp_probe_scan(&arp_hosts)
    );

    let response_times = response_times.map_err(|e| format!("ICMP scan failed: {}", e))?;
    let port_results = port_results.map_err(|e| format!("TCP scan failed: {}", e))?;

    let icmp_count = response_times.len();

    // DNS lookup
    let host_ips: Vec<std::net::Ipv4Addr> = arp_hosts
        .keys()
        .filter(|ip| **ip != interface.ip)
        .copied()
        .collect();
    
    let dns_hostnames = dns_scan(&host_ips).await;

    // Build host info list
    let mut active_hosts: Vec<HostInfo> = arp_hosts
        .iter()
        .filter(|(ip, _)| **ip != interface.ip)
        .map(|(ip, mac)| {
            let icmp_result = response_times.get(ip);
            let response_time = icmp_result.map(|r| r.duration.as_millis() as u64);
            let ttl = icmp_result.and_then(|r| r.ttl);
            let os_guess = ttl.map(guess_os_from_ttl);
            let open_ports = port_results.get(ip).cloned().unwrap_or_default();
            
            let mac_str = format!("{}", mac);
            let vendor_info = lookup_vendor_info(&mac_str);
            
            let is_gateway = ip.octets()[3] == 1 || open_ports.contains(&80);
            let device_type = infer_device_type(
                vendor_info.vendor.as_deref(),
                dns_hostnames.get(ip).map(|s| s.as_str()),
                &open_ports,
                is_gateway,
            );
            let risk_score = calculate_risk_score(
                device_type,
                &open_ports,
                vendor_info.is_randomized,
            );
            
            let method = match (response_time.is_some(), !open_ports.is_empty()) {
                (true, true) => "ARP+ICMP+TCP",
                (true, false) => "ARP+ICMP",
                (false, true) => "ARP+TCP",
                (false, false) => "ARP",
            }.to_string();

            // Lookup vulnerabilities and port warnings from database
            let db_conn = state.db.lock().unwrap().connection();
            let conn = db_conn.lock().unwrap();
            
            // Smart CVE filtering based on device type and open ports
            let device_type_str = device_type.as_str();
            let vulnerabilities = if let Some(ref vendor) = vendor_info.vendor {
                filter_vulnerabilities_by_context(
                    &conn,
                    vendor,
                    &device_type_str,
                    &open_ports
                ).unwrap_or_default()
            } else {
                // No vendor - only universal port warnings
                let mut vulns = Vec::new();
                if open_ports.contains(&23) {
                    if let Ok(mut telnet) = filter_vulnerabilities_by_context(&conn, "", "Unknown", &[23]) {
                        vulns.append(&mut telnet);
                    }
                }
                if open_ports.contains(&21) {
                    if let Ok(mut ftp) = filter_vulnerabilities_by_context(&conn, "", "Unknown", &[21]) {
                        vulns.append(&mut ftp);
                    }
                }
                if open_ports.contains(&80) {
                    if let Ok(mut http) = filter_vulnerabilities_by_context(&conn, "", "Unknown", &[80]) {
                        vulns.append(&mut http);
                    }
                }
                vulns
            };
            
            let port_warnings = if !open_ports.is_empty() {
                lookup_port_warnings(&conn, &open_ports).unwrap_or_default()
            } else {
                Vec::new()
            };
            
            drop(conn); // Release lock

            let mut host = HostInfo {
                ip: ip.to_string(),
                vendor: vendor_info.vendor,
                is_randomized: vendor_info.is_randomized,
                mac: mac_str,
                response_time_ms: response_time,
                ttl,
                os_guess,
                device_type: device_type.as_str().to_string(),
                risk_score,
                open_ports,
                discovery_method: method,
                hostname: dns_hostnames.get(ip).cloned(),
                system_description: None,
                uptime_seconds: None,
                neighbors: Vec::new(),
                vulnerabilities,
                port_warnings,
                security_grade: String::new(),
            };
            
            // Calculate security grade
            host.security_grade = calculate_security_grade(&host);
            
            host
        })
        .collect();

    // Add local machine
    let local_mac = format!("{}", interface.mac);
    let local_vendor_info = lookup_vendor_info(&local_mac);
    let local_device_type = infer_device_type(
        local_vendor_info.vendor.as_deref(),
        None,
        &[],
        false,
    );
    
    // Lookup vulnerabilities for local machine using smart filtering
    let db_conn = state.db.lock().unwrap().connection();
    let conn = db_conn.lock().unwrap();
    
    let local_device_type_str = local_device_type.as_str();
    let local_vulnerabilities = if let Some(ref vendor) = local_vendor_info.vendor {
        filter_vulnerabilities_by_context(
            &conn,
            vendor,
            &local_device_type_str,
            &[] // Local machine - no ports scanned
        ).unwrap_or_default()
    } else {
        Vec::new()
    };
    
    drop(conn); // Release lock
    
    let mut local_host = HostInfo {
        ip: interface.ip.to_string(),
        vendor: local_vendor_info.vendor,
        is_randomized: local_vendor_info.is_randomized,
        mac: local_mac,
        response_time_ms: Some(0),
        ttl: None,
        os_guess: None,
        device_type: local_device_type.as_str().to_string(),
        risk_score: 0,
        open_ports: Vec::new(),
        discovery_method: "LOCAL".to_string(),
        hostname: None,
        system_description: None,
        uptime_seconds: None,
        neighbors: Vec::new(),
        vulnerabilities: local_vulnerabilities,
        port_warnings: Vec::new(),
        security_grade: String::new(),
    };
    
    // Calculate security grade for local machine
    local_host.security_grade = calculate_security_grade(&local_host);
    
    active_hosts.push(local_host);

    // Sort by IP
    active_hosts.sort_by(|a, b| {
        let ip_a: std::net::Ipv4Addr = a.ip.parse().unwrap_or(std::net::Ipv4Addr::UNSPECIFIED);
        let ip_b: std::net::Ipv4Addr = b.ip.parse().unwrap_or(std::net::Ipv4Addr::UNSPECIFIED);
        ip_a.cmp(&ip_b)
    });

    let duration = start.elapsed().as_millis() as u64;

    let scan_result = ScanResult {
        interface_name: interface.name,
        local_ip: interface.ip.to_string(),
        local_mac: format!("{}", interface.mac),
        subnet: subnet.to_string(),
        scan_method: "Active ARP + ICMP + TCP".to_string(),
        arp_discovered: arp_count,
        icmp_discovered: icmp_count,
        total_hosts: active_hosts.len(),
        scan_duration_ms: duration,
        active_hosts,
    };

    // Save scan result to database
    {
        let db = state.db.lock().unwrap();
        let conn = db.connection();
        let conn = conn.lock().unwrap();
        if let Err(e) = queries::insert_scan(&conn, &scan_result) {
            eprintln!("[WARN] Failed to save scan to database: {}", e);
        }
    }

    Ok(scan_result)
}

/// Get available network interfaces
#[tauri::command]
pub fn get_interfaces() -> Result<Vec<String>, String> {
    let interface = find_valid_interface()
        .map_err(|e| format!("Failed to find interfaces: {}", e))?;
    
    Ok(vec![interface.name])
}

// =====================================================
// Database Commands
// =====================================================

/// Get recent scan history
#[tauri::command]
pub fn get_scan_history(state: tauri::State<'_, AppState>, limit: Option<i32>) -> Result<Vec<ScanRecord>, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    queries::get_recent_scans(&conn, limit.unwrap_or(20))
        .map_err(|e| format!("Failed to get scan history: {}", e))
}

/// Get all known devices
#[tauri::command]
pub fn get_all_devices(state: tauri::State<'_, AppState>) -> Result<Vec<DeviceRecord>, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    queries::get_all_devices(&conn)
        .map_err(|e| format!("Failed to get devices: {}", e))
}

/// Get device by MAC address
#[tauri::command]
pub fn get_device_by_mac(state: tauri::State<'_, AppState>, mac: String) -> Result<Option<DeviceRecord>, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    queries::get_device_by_mac(&conn, &mac)
        .map_err(|e| format!("Failed to get device: {}", e))
}

/// Update device custom name
#[tauri::command]
pub fn update_device_name(state: tauri::State<'_, AppState>, mac: String, name: String) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    queries::update_device_name(&conn, &mac, &name)
        .map_err(|e| format!("Failed to update device name: {}", e))
}

/// Get network statistics
#[tauri::command]
pub fn get_network_stats(state: tauri::State<'_, AppState>) -> Result<NetworkStats, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    queries::get_network_stats(&conn)
        .map_err(|e| format!("Failed to get network stats: {}", e))
}

/// Get unread alerts
#[tauri::command]
pub fn get_unread_alerts(state: tauri::State<'_, AppState>) -> Result<Vec<AlertRecord>, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    queries::get_unread_alerts(&conn)
        .map_err(|e| format!("Failed to get alerts: {}", e))
}

/// Mark alert as read
#[tauri::command]
pub fn mark_alert_read(state: tauri::State<'_, AppState>, alert_id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    queries::mark_alert_read(&conn, alert_id)
        .map_err(|e| format!("Failed to mark alert read: {}", e))
}

/// Mark all alerts as read
#[tauri::command]
pub fn mark_all_alerts_read(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    queries::mark_all_alerts_read(&conn)
        .map_err(|e| format!("Failed to mark alerts read: {}", e))
}

/// Get database path (for debugging)
#[tauri::command]
pub fn get_database_path(state: tauri::State<'_, AppState>) -> String {
    let db = state.db.lock().unwrap();
    db.path().to_string_lossy().to_string()
}

// =====================================================
// Monitoring Commands
// =====================================================

/// Start background network monitoring
#[tauri::command]
pub async fn start_monitoring(
    monitor_state: tauri::State<'_, MonitorState>,
    app: tauri::AppHandle,
    interval_seconds: Option<u64>,
) -> Result<(), String> {
    let monitor = monitor_state.monitor.lock().await;
    
    // Create callback that emits events to Tauri frontend
    let app_handle = app.clone();
    let callback = move |event: NetworkEvent| {
        let _ = app_handle.emit("network-event", &event);
    };
    
    monitor.start(callback, interval_seconds).await
}

/// Stop background network monitoring
#[tauri::command]
pub async fn stop_monitoring(
    monitor_state: tauri::State<'_, MonitorState>,
) -> Result<(), String> {
    let monitor = monitor_state.monitor.lock().await;
    monitor.stop();
    Ok(())
}

/// Get current monitoring status
#[tauri::command]
pub async fn get_monitoring_status(
    monitor_state: tauri::State<'_, MonitorState>,
) -> Result<MonitoringStatus, String> {
    let monitor = monitor_state.monitor.lock().await;
    Ok(monitor.status().await)
}

// =====================================================
// AI Insights Commands
// =====================================================

// Note: NetworkHealth, DeviceDistribution, SecurityReport are available for future AI insights
#[allow(unused_imports)]
use host_discovery::{NetworkHealth, DeviceDistribution};

/// Get network health score from current scan
#[tauri::command]
pub fn get_network_health(
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    // Get recent device history to calculate health
    let devices = queries::get_all_devices(&conn)
        .map_err(|e| format!("Failed to get devices: {}", e))?;
    
    let device_count = devices.len();
    
    // Calculate security score (based on unknown devices and risk factors)
    let unknown_count = devices.iter()
        .filter(|d| d.device_type.as_deref() == Some("UNKNOWN"))
        .count();
    let unknown_ratio = if device_count > 0 { 
        (unknown_count as f64 / device_count as f64) * 100.0 
    } else { 0.0 };
    let security_score = (100.0 - unknown_ratio * 2.0).max(0.0).min(100.0) as usize;
    
    // Calculate stability score (based on device consistency)
    let has_vendor = devices.iter()
        .filter(|d| d.vendor.is_some())
        .count();
    let vendor_ratio = if device_count > 0 { 
        (has_vendor as f64 / device_count as f64) * 100.0 
    } else { 0.0 };
    let stability_score = vendor_ratio as usize;
    
    // Calculate compliance score (based on properly identified devices)
    let properly_identified = devices.iter()
        .filter(|d| d.device_type.is_some() && d.device_type.as_deref() != Some("UNKNOWN"))
        .count();
    let id_ratio = if device_count > 0 { 
        (properly_identified as f64 / device_count as f64) * 100.0 
    } else { 0.0 };
    let compliance_score = id_ratio as usize;
    
    // Overall score (weighted average)
    let score = if device_count == 0 { 
        0 
    } else { 
        (security_score * 40 + stability_score * 30 + compliance_score * 30) / 100
    };
    
    let grade = match score {
        90..=100 => 'A',
        80..=89 => 'B', 
        70..=79 => 'C',
        60..=69 => 'D',
        _ => 'F',
    };
    
    let status = match score {
        80..=100 => "Excellent",
        60..=79 => "Good",
        40..=59 => "Fair",
        _ => "Poor",
    };
    
    // Generate insights
    let mut insights = vec![
        format!("{} devices tracked", device_count),
    ];
    
    if unknown_count > 0 {
        insights.push(format!("{} device(s) need identification", unknown_count));
    }
    
    if security_score < 70 {
        insights.push("Consider reviewing unidentified devices".to_string());
    }
    
    if stability_score >= 80 {
        insights.push("Good vendor identification coverage".to_string());
    }
    
    Ok(serde_json::json!({
        "score": score,
        "grade": grade.to_string(),
        "status": status,
        "breakdown": {
            "security": security_score,
            "stability": stability_score,
            "compliance": compliance_score
        },
        "insights": insights
    }))
}

/// Get device distribution stats
#[tauri::command]
pub fn get_device_distribution(
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    let devices = queries::get_all_devices(&conn)
        .map_err(|e| format!("Failed to get devices: {}", e))?;
    
    let mut by_type: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for device in &devices {
        let dtype = device.device_type.clone().unwrap_or_else(|| "UNKNOWN".to_string());
        *by_type.entry(dtype).or_insert(0) += 1;
    }
    
    Ok(serde_json::json!({
        "total": devices.len(),
        "by_type": by_type,
    }))
}

// =====================================================
// Export Commands
// =====================================================

/// Export devices to CSV
#[tauri::command]
pub fn export_devices_to_csv(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    let devices = queries::get_all_devices(&conn)
        .map_err(|e| format!("Failed to get devices: {}", e))?;
    
    export_devices_csv(&devices)
        .map_err(|e| format!("Failed to export CSV: {}", e))
}

/// Export current scan hosts to CSV
#[tauri::command]
pub fn export_scan_to_csv(
    hosts: Vec<HostInfo>,
) -> Result<String, String> {
    export_hosts_csv(&hosts)
        .map_err(|e| format!("Failed to export CSV: {}", e))
}

/// Export topology data to JSON
#[tauri::command]
pub fn export_topology_to_json(
    hosts: Vec<HostInfo>,
    network: String,
) -> Result<String, String> {
    export_topology_json(&hosts, &network)
        .map_err(|e| format!("Failed to export JSON: {}", e))
}

/// Export full scan result to JSON
#[tauri::command]
pub fn export_scan_to_json(
    scan: ScanResult,
) -> Result<String, String> {
    export_scan_result_json(&scan)
        .map_err(|e| format!("Failed to export JSON: {}", e))
}

/// Generate and export scan report PDF
#[tauri::command]
pub fn export_scan_report(
    state: tauri::State<'_, AppState>,
    scan: ScanResult,
    hosts: Vec<HostInfo>,
) -> Result<Vec<u8>, String> {
    let db = state.db.lock().unwrap();
    let conn = db.connection();
    let conn = conn.lock().unwrap();
    
    let stats = queries::get_network_stats(&conn).ok();
    
    generate_scan_report_pdf(&scan, &hosts, stats.as_ref())
        .map_err(|e| format!("Failed to generate PDF: {}", e))
}

/// Generate and export network health/security report PDF
#[tauri::command]
pub fn export_security_report(
    hosts: Vec<HostInfo>,
) -> Result<Vec<u8>, String> {
    let recommendations = SecurityReport::generate(&hosts);
    
    generate_network_health_pdf(&recommendations)
        .map_err(|e| format!("Failed to generate PDF: {}", e))
}


// ==================== NETWORK TOOLS COMMANDS ====================

/// Ping result with latency and TTL information
#[derive(serde::Serialize)]
pub struct PingResult {
    success: bool,
    latency_ms: Option<f64>,
    ttl: Option<u8>,
    os_guess: Option<String>,
    error: Option<String>,
}

/// Ping a single host
#[tauri::command]
pub async fn ping_host(target: String, count: u32) -> Result<Vec<PingResult>, String> {
    use std::net::{IpAddr, ToSocketAddrs};
    use std::time::Duration;
    use surge_ping::{Client, Config, PingIdentifier, PingSequence, IcmpPacket};

    
    // Resolve hostname to IP
    let ip = if let Ok(addr) = target.parse::<IpAddr>() {
        addr
    } else {
        // Try DNS resolution
        let addr_str = format!("{}:0", target);
        match addr_str.to_socket_addrs() {
            Ok(mut addrs) => {
                if let Some(socket_addr) = addrs.next() {
                    socket_addr.ip()
                } else {
                    return Err("Could not resolve hostname".to_string());
                }
            }
            Err(_) => return Err("Invalid IP address or hostname".to_string()),
        }
    };
    
    // Create ICMP client
    let config = Config::default();
    let client = Client::new(&config)
        .map_err(|e| format!("Failed to create ICMP client: {}", e))?;
    
    let mut results = Vec::new();
    let payload = [0u8; 56];
    
    for i in 0..count {
        let start = Instant::now();
        
        let mut pinger = client.pinger(ip, PingIdentifier(1234)).await;
        match tokio::time::timeout(
            Duration::from_secs(2),
            pinger.timeout(Duration::from_secs(2))
                .ping(PingSequence(i as u16), &payload)
        ).await {
            Ok(Ok((packet, _rtt))) => {
                let latency = start.elapsed().as_secs_f64() * 1000.0;
                let ttl = match packet {
                    IcmpPacket::V4(p) => p.get_ttl(),
                    IcmpPacket::V6(_) => None,
                };
                let os_guess = ttl.map(|t| guess_os_from_ttl(t));
                
                results.push(PingResult {
                    success: true,
                    latency_ms: Some(latency),
                    ttl,
                    os_guess,
                    error: None,
                });
            }
            Ok(Err(e)) => {
                results.push(PingResult {
                    success: false,
                    latency_ms: None,
                    ttl: None,
                    os_guess: None,
                    error: Some(format!("Ping failed: {}", e)),
                });
            }
            Err(_) => {
                results.push(PingResult {
                    success: false,
                    latency_ms: None,
                    ttl: None,
                    os_guess: None,
                    error: Some("Request timed out".to_string()),
                });
            }
        }
        
        // Small delay between pings
        if i < count - 1 {
            tokio::time::sleep(Duration::from_millis(500)).await;
        }
    }
    
    Ok(results)
}

/// Port scan result
#[derive(serde::Serialize)]
pub struct PortScanResult {
    port: u16,
    is_open: bool,
    service: Option<String>,
}

/// Scan ports on a target host
#[tauri::command]
pub async fn scan_ports(target: String, ports: Vec<u16>) -> Result<Vec<PortScanResult>, String> {
    use std::net::{IpAddr, ToSocketAddrs};
    use tokio::time::timeout;
    use std::time::Duration;
    
    // Resolve hostname to IP
    let ip = if let Ok(addr) = target.parse::<IpAddr>() {
        addr
    } else {
        let addr_str = format!("{}:0", target);
        match addr_str.to_socket_addrs() {
            Ok(mut addrs) => {
                if let Some(socket_addr) = addrs.next() {
                    socket_addr.ip()
                } else {
                    return Err("Could not resolve hostname".to_string());
                }
            }
            Err(_) => return Err("Invalid IP address or hostname".to_string()),
        }
    };
    
    let mut results = Vec::new();
    
    for port in ports {
        let addr = std::net::SocketAddr::new(ip, port);
        
        let is_open = match timeout(
            Duration::from_secs(2),
            tokio::net::TcpStream::connect(addr)
        ).await {
            Ok(Ok(_)) => true,
            _ => false,
        };
        
        let service = if is_open {
            Some(get_service_name(port))
        } else {
            None
        };
        
        results.push(PortScanResult {
            port,
            is_open,
            service,
        });
    }
    
    Ok(results)
}

/// Get common service name for a port
fn get_service_name(port: u16) -> String {
    match port {
        20 => "FTP Data".to_string(),
        21 => "FTP".to_string(),
        22 => "SSH".to_string(),
        23 => "Telnet".to_string(),
        25 => "SMTP".to_string(),
        53 => "DNS".to_string(),
        80 => "HTTP".to_string(),
        110 => "POP3".to_string(),
        143 => "IMAP".to_string(),
        443 => "HTTPS".to_string(),
        445 => "SMB".to_string(),
        3306 => "MySQL".to_string(),
        3389 => "RDP".to_string(),
        5432 => "PostgreSQL".to_string(),
        8080 => "HTTP Alt".to_string(),
        _ => "Unknown".to_string(),
    }
}

/// MAC vendor lookup result
#[derive(serde::Serialize)]
pub struct VendorLookupResult {
    mac: String,
    vendor: Option<String>,
    is_randomized: bool,
}

/// Look up vendor for a MAC address
#[tauri::command]
pub fn lookup_mac_vendor(mac: String) -> Result<VendorLookupResult, String> {
    let vendor_info = lookup_vendor_info(&mac);
    
    Ok(VendorLookupResult {
        mac: mac.clone(),
        vendor: vendor_info.vendor,
        is_randomized: vendor_info.is_randomized,
    })
}

// ==================== DEMO MODE ====================

/// Mock network scan for demo mode - returns pre-loaded sample data
#[tauri::command]
pub async fn mock_scan_network(app: tauri::AppHandle) -> Result<ScanResult, String> {
    // Load demo data
    let demo_scan = crate::demo_data::generate_demo_scan();
    
    // Simulate scanning delay for realism
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    
    // Emit progress events (simulate scanning phases)
    let _ = app.emit("scan-progress", serde_json::json!({
        "phase": "arp",
        "progress": 33
    }));
    
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    let _ = app.emit("scan-progress", serde_json::json!({
        "phase": "icmp",
        "progress": 66
    }));
    
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    let _ = app.emit("scan-progress", serde_json::json!({
        "phase": "tcp",
        "progress": 100
    }));
    
    Ok(demo_scan)
}

/// Get demo alerts
#[tauri::command]
pub fn get_demo_alerts() -> Result<Vec<AlertRecord>, String> {
    Ok(crate::demo_data::generate_demo_alerts())
}
