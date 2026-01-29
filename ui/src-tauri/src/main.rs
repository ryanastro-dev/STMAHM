//! Network Topology Mapper - Tauri Backend
//!
//! This module provides the bridge between the React UI and the Rust scanner.
//! Includes database integration for historical data storage.
//! Includes real-time network monitoring.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod demo_data;


use commands::{AppState, MonitorState};

fn main() {
    // Initialize structured logging system
    if let Err(e) = host_discovery::logging::init_logging() {
        eprintln!("Warning: Failed to initialize logging: {}", e);
        eprintln!("Continuing without file logging...");
    }
    
    tracing::info!("Network Topology Mapper starting...");
    
    // Initialize application state with database
    let app_state = AppState::new()
        .expect("Failed to initialize application state");
    
    tracing::info!("Database initialized successfully");

    // Initialize monitoring state
    let monitor_state = MonitorState::new();
    
    tracing::info!("Monitoring state initialized");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .manage(monitor_state)
        .invoke_handler(tauri::generate_handler![
            // Scanner commands
            commands::scan_network,
            commands::get_interfaces,
            // Database commands - History
            commands::get_scan_history,
            // Database commands - Devices
            commands::get_all_devices,
            commands::get_device_by_mac,
            commands::update_device_name,
            // Database commands - Stats
            commands::get_network_stats,
            // Database commands - Alerts
            commands::get_unread_alerts,
            commands::mark_alert_read,
            commands::mark_all_alerts_read,
            // Monitoring commands
            commands::start_monitoring,
            commands::stop_monitoring,
            commands::get_monitoring_status,
            // AI Insights commands
            commands::get_network_health,
            commands::get_device_distribution,
            // Export commands
            commands::export_devices_to_csv,
            commands::export_scan_to_csv,
            commands::export_topology_to_json,
            commands::export_scan_to_json,
            commands::export_scan_report,
            commands::export_security_report,
            // Network Tools commands
            commands::ping_host,
            commands::scan_ports,
            commands::lookup_mac_vendor,
            // Demo Mode commands
            commands::mock_scan_network,
            commands::get_demo_alerts,
            // Debug
            commands::get_database_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
