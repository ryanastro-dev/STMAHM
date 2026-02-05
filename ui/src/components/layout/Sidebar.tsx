import { useState } from 'react';
import {
  LayoutDashboard,
  Network,
  List,
  Shield,
  Bell,
  Wrench,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import AdminProfile from './AdminProfile';

type Page = 'dashboard' | 'topology' | 'devices' | 'vulnerabilities' | 'alerts' | 'tools' | 'reports' | 'settings' | 'profile' | 'demo';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface NavItemData {
  id: Page;
  label: string;
  icon: any;
  badge?: number;
}

interface NavGroupData {
  title: string;
  items: NavItemData[];
}

export default function Sidebar({ 
  currentPage, 
  onNavigate,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups: NavGroupData[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'topology', label: 'Topology Map', icon: Network },
        { id: 'devices', label: 'Device List', icon: List },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Shield },
        { id: 'alerts', label: 'Alerts', icon: Bell },
      ],
    },
    {
      title: 'UTILITIES',
      items: [
        { id: 'tools', label: 'Tools', icon: Wrench },
        { id: 'reports', label: 'Reports', icon: FileText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <motion.aside 
      className={clsx(
        'bg-bg-elevated border-r border-theme flex flex-col h-full relative transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-bg-elevated border border-theme 
                   flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover
                   transition-all shadow-lg"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Logo Section */}
      <div className={clsx('p-6 border-b border-theme', isCollapsed && 'px-3')}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={clsx('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}
        >
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img src="/icon.png" alt="NetMapper Pro" className="w-full h-full object-contain" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold text-text-primary whitespace-nowrap">NetMapper</h1>
                <p className="text-xs text-text-muted whitespace-nowrap">Pro Edition</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className={clsx('flex-1 overflow-y-auto', isCollapsed ? 'p-2' : 'p-4')}>
        {navGroups.map((group) => (
          <div key={group.title} className="mb-6">
            {/* Section Title - Hidden when collapsed */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 mb-2"
                >
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {group.title}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nav Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={clsx(
                      'w-full flex items-center rounded-lg transition-all duration-200 group relative',
                      isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
                      isActive
                        ? 'bg-accent-blue/10 text-accent-blue font-medium'
                        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    )}
                    whileHover={{ x: isCollapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.98 }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Icon */}
                    <Icon className="w-5 h-5 shrink-0" />
                    
                    {/* Label - Hidden when collapsed */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="font-medium text-sm flex-1 text-left whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={clsx(
                          'bg-accent-red text-white text-xs font-bold rounded-full',
                          isCollapsed 
                            ? 'absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px]'
                            : 'px-2 py-0.5'
                        )}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-blue rounded-r-full"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Tooltip on hover when collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-bg-elevated border border-theme rounded-md
                                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                                      whitespace-nowrap text-sm text-text-primary shadow-lg z-50">
                        {item.label}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin Profile */}
      <div className={clsx(isCollapsed && 'px-2')}>
        <AdminProfile isCollapsed={isCollapsed} />
      </div>
    </motion.aside>
  );
}
