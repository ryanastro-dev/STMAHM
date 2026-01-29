//! AI Insights module
//!
//! Rule-based network analysis and recommendations

pub mod health;
pub mod distribution;
pub mod recommendations;
pub mod security;
pub mod vulnerability_filter;

pub use health::*;
pub use distribution::*;
pub use recommendations::*;
pub use security::*;
pub use vulnerability_filter::*;
