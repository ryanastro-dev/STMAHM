//! Network module - interface detection and subnet utilities

mod interface;
mod subnet;

pub use interface::{find_valid_interface, interface_score};
pub use subnet::{calculate_subnet_ips, is_special_address};
