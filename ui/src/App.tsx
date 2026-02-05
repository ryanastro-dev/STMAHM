import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { ScanProvider, useScanContext, HostInfo } from './hooks/useScan';
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts';
import Sidebar from './components/layout/Sidebar';
import Titlebar from './components/layout/Titlebar';
import TopHeader from './components/layout/TopHeader';
import Dashboard from './pages/Dashboard';
import TopologyView from './pages/TopologyView';
import DeviceList from './pages/DeviceList';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Vulnerabilities from './pages/Vulnerabilities';
import Alerts from './pages/Alerts';
import Tools from './pages/Tools';
import ComponentDemo from './pages/ComponentDemo';
import DeviceDetailModal from './components/devices/DeviceDetailModal';
import WelcomeScreen, { useWelcomeScreen } from './components/common/WelcomeScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/Toast';
import DemoBanner from './components/common/DemoBanner';

type Page = 'dashboard' | 'topology' | 'devices' | 'vulnerabilities' | 'alerts' | 'tools' | 'reports' | 'settings' | 'profile' | 'demo';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedDevice, setSelectedDevice] = useState<HostInfo | null>(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const { scan, isScanning, scanStatus } = useScanContext();
  const { toggleTheme } = useTheme();
  const { shouldShow: showWelcome, markAsShown } = useWelcomeScreen();

  // Fetch unread alerts count
  const fetchUnreadAlertsCount = async () => {
    try {
      const alerts = await invoke<any[]>('get_unread_alerts');
      setUnreadAlertsCount(alerts.filter(a => !a.is_read).length);
    } catch (error) {
      console.error('Failed to fetch unread alerts:', error);
      setUnreadAlertsCount(0);
    }
  };

  // Load unread alerts count on mount and when page changes
  useEffect(() => {
    fetchUnreadAlertsCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadAlertsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debug: Monitor isScanning changes
  useEffect(() => {
    console.log('isScanning state changed:', isScanning);
  }, [isScanning]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { ...SHORTCUTS.DASHBOARD, handler: () => setCurrentPage('dashboard') },
    { ...SHORTCUTS.TOPOLOGY, handler: () => setCurrentPage('topology') },
    { ...SHORTCUTS.DEVICES, handler: () => setCurrentPage('devices') },
    { ...SHORTCUTS.SETTINGS, handler: () => setCurrentPage('settings') },
    { ...SHORTCUTS.SCAN, handler: () => !isScanning && scan() },
    { ...SHORTCUTS.TOGGLE_THEME, handler: toggleTheme },
  ]);

  const handleDeviceSelect = (device: HostInfo) => {
    setSelectedDevice(device);
  };

  const handleCloseModal = () => {
    setSelectedDevice(null);
  };

  const handleScan = () => {
    console.log('handleScan called, current isScanning:', isScanning);
    scan();
  };

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'topology':
        return <TopologyView onDeviceClick={handleDeviceSelect} />;
      case 'devices':
        return <DeviceList onDeviceClick={handleDeviceSelect} />;
      case 'settings':
        return <Settings />;
      case 'demo':
        return <ComponentDemo />;
      case 'vulnerabilities':
        return <Vulnerabilities />;
      case 'alerts':
        return <Alerts />;
      case 'tools':
        return <Tools />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Welcome Screen Overlay */}
      {showWelcome && (
        <WelcomeScreen
          onStartScan={() => {
            markAsShown();
            scan();
          }}
          isScanning={isScanning}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handlePageChange}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Custom Titlebar (macOS/Windows controls) */}
        <Titlebar />
        
        {/* Demo Mode Banner */}
        <DemoBanner />
        
        {/* Top Header (Page Title, Status, Scan Controls) */}
        <TopHeader 
          currentPage={currentPage} 
          isScanning={isScanning}
          scanStatus={scanStatus}
          onStartScan={handleScan}
          onStopScan={() => {
            // TODO: Implement stop scan functionality if needed
            console.log('Stop scan requested');
          }}
          onNavigateToAlerts={() => setCurrentPage('alerts')}
          unreadAlertsCount={unreadAlertsCount}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>

      {/* Device Detail Modal */}
      <DeviceDetailModal device={selectedDevice} onClose={handleCloseModal} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ScanProvider>
          <AppContent />
          <ToastProvider />
        </ScanProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
