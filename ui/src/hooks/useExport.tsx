/**
 * useExport Hook - Handle all export functionality
 * 
 * Provides methods to export data as PDF, CSV, or JSON
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { HostInfo, ScanResult } from './useScan';

export type ExportType = 
  | 'devices-csv' 
  | 'scan-csv' 
  | 'topology-json' 
  | 'scan-json' 
  | 'scan-pdf' 
  | 'security-pdf'
  | null;

interface UseExportReturn {
  // CSV exports
  exportDevicesCSV: () => Promise<void>;
  exportScanCSV: (hosts: HostInfo[]) => Promise<void>;
  
  // JSON exports
  exportTopologyJSON: (hosts: HostInfo[], network: string) => Promise<void>;
  exportScanJSON: (scan: ScanResult) => Promise<void>;
  
  // PDF exports
  exportScanReportPDF: (scan: ScanResult, hosts: HostInfo[]) => Promise<void>;
  exportSecurityReportPDF: (hosts: HostInfo[]) => Promise<void>;
  
  // State - now tracks which specific export is in progress
  exportingType: ExportType;
  error: string | null;
}

export function useExport(): UseExportReturn {
  const [exportingType, setExportingType] = useState<ExportType>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save text content to file
   */
  const saveTextFile = useCallback(async (content: string, defaultFilename: string, filters: any[]) => {
    try {
      const filePath = await save({
        defaultPath: defaultFilename,
        filters,
      });

      if (!filePath) {
        return; // User cancelled
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      await writeFile(filePath, data);

      console.log(`✅ File saved: ${filePath}`);
    } catch (err) {
      console.error('Failed to save file:', err);
      throw err;
    }
  }, []);

  /**
   * Save binary content (PDF) to file
   */
  const saveBinaryFile = useCallback(async (data: Uint8Array, defaultFilename: string, filters: any[]) => {
    try {
      const filePath = await save({
        defaultPath: defaultFilename,
        filters,
      });

      if (!filePath) {
        return; // User cancelled
      }

      await writeFile(filePath, data);

      console.log(`✅ PDF saved: ${filePath}`);
    } catch (err) {
      console.error('Failed to save PDF:', err);
      throw err;
    }
  }, []);

  /**
   * Export all devices to CSV
   */
  const exportDevicesCSV = useCallback(async () => {
    setExportingType('devices-csv');
    setError(null);

    try {
      const csv: string = await invoke('export_devices_to_csv');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      await saveTextFile(
        csv,
        `network-devices-${timestamp}.csv`,
        [{ name: 'CSV', extensions: ['csv'] }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to export devices CSV');
      console.error('Export devices CSV error:', err);
    } finally {
      setExportingType(null);
    }
  }, [saveTextFile]);

  /**
   * Export scan hosts to CSV
   */
  const exportScanCSV = useCallback(async (hosts: HostInfo[]) => {
    setExportingType('scan-csv');
    setError(null);

    try {
      const csv: string = await invoke('export_scan_to_csv', { hosts });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      await saveTextFile(
        csv,
        `scan-results-${timestamp}.csv`,
        [{ name: 'CSV', extensions: ['csv'] }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to export scan CSV');
      console.error('Export scan CSV error:', err);
    } finally {
      setExportingType(null);
    }
  }, [saveTextFile]);

  /**
   * Export topology data to JSON
   */
  const exportTopologyJSON = useCallback(async (hosts: HostInfo[], network: string) => {
    setExportingType('topology-json');
    setError(null);

    try {
      const json: string = await invoke('export_topology_to_json', { hosts, network });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      await saveTextFile(
        json,
        `topology-${timestamp}.json`,
        [{ name: 'JSON', extensions: ['json'] }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to export topology JSON');
      console.error('Export topology JSON error:', err);
    } finally {
      setExportingType(null);
    }
  }, [saveTextFile]);

  /**
   * Export full scan result to JSON
   */
  const exportScanJSON = useCallback(async (scan: ScanResult) => {
    setExportingType('scan-json');
    setError(null);

    try {
      const json: string = await invoke('export_scan_to_json', { scan });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      await saveTextFile(
        json,
        `scan-${timestamp}.json`,
        [{ name: 'JSON', extensions: ['json'] }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to export scan JSON');
      console.error('Export scan JSON error:', err);
    } finally {
      setExportingType(null);
    }
  }, [saveTextFile]);

  /**
   * Export scan report as PDF
   */
  const exportScanReportPDF = useCallback(async (scan: ScanResult, hosts: HostInfo[]) => {
    setExportingType('scan-pdf');
    setError(null);

    try {
      const pdfBytes: number[] = await invoke('export_scan_report', { scan, hosts });
      const pdfData = new Uint8Array(pdfBytes);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      await saveBinaryFile(
        pdfData,
        `network-scan-report-${timestamp}.pdf`,
        [{ name: 'PDF', extensions: ['pdf'] }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to export scan report PDF');
      console.error('Export scan report PDF error:', err);
    } finally {
      setExportingType(null);
    }
  }, [saveBinaryFile]);

  /**
   * Export security/health report as PDF
   */
  const exportSecurityReportPDF = useCallback(async (hosts: HostInfo[]) => {
    setExportingType('security-pdf');
    setError(null);

    try {
      const pdfBytes: number[] = await invoke('export_security_report', { hosts });
      const pdfData = new Uint8Array(pdfBytes);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      await saveBinaryFile(
        pdfData,
        `security-report-${timestamp}.pdf`,
        [{ name: 'PDF', extensions: ['pdf'] }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to export security report PDF');
      console.error('Export security report PDF error:', err);
    } finally {
      setExportingType(null);
    }
  }, [saveBinaryFile]);

  return {
    exportDevicesCSV,
    exportScanCSV,
    exportTopologyJSON,
    exportScanJSON,
    exportScanReportPDF,
    exportSecurityReportPDF,
    exportingType,
    error,
  };
}
