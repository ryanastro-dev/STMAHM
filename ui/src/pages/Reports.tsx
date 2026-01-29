/**
 * Reports Page - Export Center
 * 
 * Centralized dashboard for all export functionality
 */

import { useState } from 'react';
import { FileDown, FileText, FileJson, FileSpreadsheet, Shield, Network } from 'lucide-react';
import { useScanContext } from '../hooks/useScan';
import { useExport } from '../hooks/useExport';
import Button from '../components/common/Button';

interface ExportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  format: string;
  onExport: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

function ExportCard({ title, description, icon, format, onExport, isLoading, disabled }: ExportCardProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
          <p className="text-sm text-text-muted mb-4">{description}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-text-muted px-2 py-1 bg-bg-secondary rounded">
              {format}
            </span>
            <Button
              onClick={handleExport}
              disabled={disabled || loading || isLoading}
              className="ml-auto"
            >
              {loading || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const { scanResult } = useScanContext();
  const {
    exportDevicesCSV,
    exportScanCSV,
    exportTopologyJSON,
    exportScanJSON,
    exportScanReportPDF,
    exportSecurityReportPDF,
    exportingType,
    error,
  } = useExport();

  const hasData = scanResult && scanResult.active_hosts && scanResult.active_hosts.length > 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          📊 Reports & Export
        </h1>
        <p className="text-text-muted">
          Generate professional reports and export network data in various formats
        </p>
      </div>

      {/* Status Message */}
      {!hasData && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-700 dark:text-yellow-300">
            ⚠️ No scan data available. Please run a network scan first to generate reports.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300">
            ❌ Error: {error}
          </p>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan Report PDF */}
        <ExportCard
          title="Scan Report"
          description="Professional PDF report with network analysis, device inventory, and statistics"
          icon={<FileText className="w-6 h-6" />}
          format="PDF"
          onExport={async () => {
            if (scanResult) {
              await exportScanReportPDF(scanResult, scanResult.active_hosts);
            }
          }}
          isLoading={exportingType === 'scan-pdf'}
          disabled={!hasData}
        />

        {/* Device List CSV */}
        <ExportCard
          title="Device List"
          description="Export all discovered devices to CSV format for spreadsheet analysis"
          icon={<FileSpreadsheet className="w-6 h-6" />}
          format="CSV"
          onExport={exportDevicesCSV}
          isLoading={exportingType === 'devices-csv'}
          disabled={!hasData}
        />

        {/* Security Report PDF */}
        <ExportCard
          title="Security Report"
          description="Network health assessment with security recommendations and risk analysis"
          icon={<Shield className="w-6 h-6" />}
          format="PDF"
          onExport={async () => {
            if (scanResult && scanResult.active_hosts) {
              await exportSecurityReportPDF(scanResult.active_hosts);
            }
          }}
          isLoading={exportingType === 'security-pdf'}
          disabled={!hasData}
        />

        {/* Topology Data JSON */}
        <ExportCard
          title="Topology Data"
          description="Export network topology structure as JSON for custom visualization or analysis"
          icon={<Network className="w-6 h-6" />}
          format="JSON"
          onExport={async () => {
            if (scanResult && scanResult.active_hosts) {
              await exportTopologyJSON(scanResult.active_hosts, scanResult.subnet);
            }
          }}
          isLoading={exportingType === 'topology-json'}
          disabled={!hasData}
        />

        {/* Scan Results CSV */}
        <ExportCard
          title="Scan Results"
          description="Export current scan results to CSV with all device details and metrics"
          icon={<FileSpreadsheet className="w-6 h-6" />}
          format="CSV"
          onExport={async () => {
            if (scanResult && scanResult.active_hosts) {
              await exportScanCSV(scanResult.active_hosts);
            }
          }}
          isLoading={exportingType === 'scan-csv'}
          disabled={!hasData}
        />

        {/* Raw Scan Data JSON */}
        <ExportCard
          title="Raw Scan Data"
          description="Export complete scan result with all metadata in JSON format"
          icon={<FileJson className="w-6 h-6" />}
          format="JSON"
          onExport={async () => {
            if (scanResult) {
              await exportScanJSON(scanResult);
            }
          }}
          isLoading={exportingType === 'scan-json'}
          disabled={!hasData}
        />
      </div>

      {/* Quick Actions (if needed) */}
      {hasData && (
        <div className="mt-8 p-6 bg-bg-secondary rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            📌 Quick Tips
          </h2>
          <ul className="space-y-2 text-sm text-text-muted">
            <li>• PDF reports are ideal for documentation and presentations</li>
            <li>• CSV files can be opened in Excel or Google Sheets for analysis</li>
            <li>• JSON exports preserve full data structure for programmatic use</li>
            <li>• Security reports include actionable recommendations</li>
          </ul>
        </div>
      )}
    </div>
  );
}
