/**
 * React hook for managing network scan state and Tauri integration
 */

import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Types matching Rust ScanResult
export interface VulnerabilityInfo {
  cve_id: string;
  description: string;
  severity: string;
  cvss_score?: number;
}

export interface PortWarning {
  port: number;
  service: string;
  warning: string;
  severity: string;
  recommendation?: string;
}

export interface HostInfo {
  ip: string;
  mac: string;
  vendor?: string;
  is_randomized?: boolean;
  response_time_ms?: number | null;
  ttl?: number;
  os_guess?: string;
  device_type: string;
  risk_score: number;
  open_ports?: number[];
  discovery_method: string;
  hostname?: string;
  system_description?: string;
  uptime_seconds?: number;
  vulnerabilities?: VulnerabilityInfo[];
  port_warnings?: PortWarning[];
  security_grade?: string;
}

export interface ScanResult {
  interface_name: string;
  local_ip: string;
  local_mac: string;
  subnet: string;
  scan_method: string;
  arp_discovered: number;
  icmp_discovered: number;
  total_hosts: number;
  scan_duration_ms: number;
  active_hosts: HostInfo[];
}

export interface ScanState {
  isScanning: boolean;
  scanResult: ScanResult | null;
  error: string | null;
  lastScanTime: Date | null;
}

/**
 * Check if running in Tauri environment (supports v1 and v2)
 */
function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Tauri v2 uses __TAURI_INTERNALS__
  // Tauri v1 uses __TAURI__
  // @ts-ignore - These globals are injected by Tauri
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}

/**
 * Hook for managing network scan state
 */
export function useScan() {
  const [state, setState] = useState<ScanState>({
    isScanning: false,
    scanResult: null,
    error: null,
    lastScanTime: null,
  });

  const [tauriAvailable, setTauriAvailable] = useState(false);

  // Check Tauri availability on mount
  useEffect(() => {
    setTauriAvailable(isTauri());
  }, []);

  // Perform a network scan
  const scan = useCallback(async () => {
    // Check if demo mode is enabled
    const isDemoMode = localStorage.getItem('demo-mode-enabled') === 'true';
    
    // Always try to invoke - if it fails, we'll catch the error
    setState(prev => ({
      ...prev,
      isScanning: true,
      error: null,
    }));

    try {
      // Use mock scan in demo mode, real scan otherwise
      const command = isDemoMode ? 'mock_scan_network' : 'scan_network';
      const result = await invoke<ScanResult>(command);
      
      setState({
        isScanning: false,
        scanResult: result,
        error: null,
        lastScanTime: new Date(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Check if it's a Tauri-specific error
      if (errorMessage.includes('invoke') || errorMessage.includes('__TAURI__')) {
        setState(prev => ({
          ...prev,
          isScanning: false,
          error: 'Not running in Tauri environment. Please run with `npm run tauri dev`.',
        }));
      } else {
        setState(prev => ({
          ...prev,
          isScanning: false,
          error: errorMessage,
        }));
      }
    }
  }, []);

  return {
    ...state,
    scan,
    tauriAvailable,
  };
}

/**
 * Global scan context
 */
interface ScanContextType extends ScanState {
  scan: () => Promise<void>;
  tauriAvailable: boolean;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  const scanState = useScan();

  return (
    <ScanContext.Provider value={scanState}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScanContext() {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error('useScanContext must be used within a ScanProvider');
  }
  return context;
}
