import { useState } from 'react';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { ScanProvider, useScanContext, HostInfo } from './hooks/useScan';
import { useSidebarCollapse } from './hooks/useSidebarCollapse';
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
  const { scan, isScanning } = useScanContext();
  const { isCollapsed, toggle: toggleSidebar } = useSidebarCollapse();
  const { toggleTheme } = useTheme();
  const { shouldShow: showWelcome, markAsShown } = useWelcomeScreen();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { ...SHORTCUTS.DASHBOARD, handler: () => setCurrentPage('dashboard') },
    { ...SHORTCUTS.TOPOLOGY, handler: () => setCurrentPage('topology') },
    { ...SHORTCUTS.DEVICES, handler: () => setCurrentPage('devices') },
    { ...SHORTCUTS.SETTINGS, handler: () => setCurrentPage('settings') },
    { ...SHORTCUTS.SCAN, handler: () => !isScanning && scan() },
    { ...SHORTCUTS.TOGGLE_SIDEBAR, handler: toggleSidebar },
    { ...SHORTCUTS.TOGGLE_THEME, handler: toggleTheme },
  ]);

  const handleDeviceSelect = (device: HostInfo) => {
    setSelectedDevice(device);
  };

  const handleCloseModal = () => {
    setSelectedDevice(null);
  };

  const handleScan = () => {
    scan();
  };

  const handleSearch = (query: string) => {
    // TODO: Implement global search functionality
    console.log('Search query:', query);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onDeviceClick={handleDeviceSelect} />;
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
        return <Dashboard onDeviceClick={handleDeviceSelect} onScan={handleScan} />;
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
        onNavigate={setCurrentPage} 
        onScan={handleScan}
        isScanning={isScanning}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Custom Titlebar (macOS/Windows controls) */}
        <Titlebar />
        
        {/* Demo Mode Banner */}
        <DemoBanner />
        
        {/* Top Header (Search, Notifications, Theme) */}
        <TopHeader onSearch={handleSearch} />
        
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
          <ToastProvider />
          <AppContent />
        </ScanProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
