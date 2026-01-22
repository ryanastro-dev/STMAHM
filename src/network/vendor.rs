//! MAC Address Vendor Lookup using OUI Database
//! 
//! Uses the macaddress.io database to identify device manufacturers.

use mac_oui::Oui;
use std::sync::OnceLock;

/// Global OUI database instance (loaded once)
static OUI_DB: OnceLock<Option<Oui>> = OnceLock::new();

/// Initialize the OUI database
fn get_oui_db() -> Option<&'static Oui> {
    OUI_DB.get_or_init(|| {
        Oui::default().ok()
    }).as_ref()
}

/// Look up the vendor/manufacturer for a given MAC address
/// 
/// # Arguments
/// * `mac` - MAC address string in format "XX:XX:XX:XX:XX:XX" or "XX-XX-XX-XX-XX-XX"
/// 
/// # Returns
/// * `Option<String>` - Vendor name if found, None otherwise
pub fn lookup_vendor(mac: &str) -> Option<String> {
    let db = get_oui_db()?;
    
    // mac_oui handles various MAC formats
    if let Ok(Some(entry)) = db.lookup_by_mac(mac) {
        Some(entry.company_name.clone())
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_lookup_vendor() {
        // Test with known OUI
        let result = lookup_vendor("00:1C:B3:00:00:00");
        println!("Vendor lookup result: {:?}", result);
    }
}
