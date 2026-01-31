/**
 * Custom Window Titlebar Component
 * Platform-specific window controls for Tauri app
 */

import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, X, Maximize2 } from 'lucide-react';
import { usePlatform } from '../../hooks/usePlatform';

interface TitlebarProps {
  transparent?: boolean;
}

export default function Titlebar({ transparent = false }: TitlebarProps) {
  const { isWindows, isMacOS } = usePlatform();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const appWindow = getCurrentWindow();
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
        console.log('[Titlebar] Initial maximize state:', maximized);
      } catch (error) {
        console.error('[Titlebar] Failed to check window state:', error);
      }
    };

    checkMaximized();
  }, []);

  const handleMinimize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Titlebar] Minimize clicked');
    try {
      const appWindow = getCurrentWindow();
      appWindow.minimize();
    } catch (error) {
      console.error('[Titlebar] Failed to minimize:', error);
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Titlebar] Maximize clicked');
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
      console.log('[Titlebar] New maximize state:', maximized);
    } catch (error) {
      console.error('[Titlebar] Failed to maximize:', error);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Titlebar] Close clicked');
    try {
      const appWindow = getCurrentWindow();
      appWindow.close();
    } catch (error) {
      console.error('[Titlebar] Failed to close:', error);
    }
  };

  // macOS-style traffic lights (left-aligned)
  if (isMacOS) {
    return (
      <div className="h-8 bg-bg-secondary border-b border-theme flex items-center select-none">
        {/* Button area - NO drag region */}
        <div className="flex items-center gap-2 px-3 z-10">
          <button
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF4136] transition-colors group relative cursor-pointer"
            aria-label="Close"
          >
            <X className="w-2 h-2 absolute inset-0 m-auto text-[#8D0600] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleMinimize}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:bg-[#FFB700] transition-colors group relative cursor-pointer"
            aria-label="Minimize"
          >
            <Minus className="w-2 h-2 absolute inset-0 m-auto text-[#995700] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleMaximize}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className="w-3 h-3 rounded-full bg-[#28CA42] hover:bg-[#1FA834] transition-colors group relative cursor-pointer"
            aria-label="Maximize"
          >
            <Maximize2 className="w-2 h-2 absolute inset-0 m-auto text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        {/* Draggable area */}
        <div className="flex-1 text-center text-sm font-medium text-text-secondary" data-tauri-drag-region>
          NetMapper Pro
        </div>
        <div className="w-[100px]"></div> {/* Spacer for symmetry */}
      </div>
    );
  }

  // Windows-style controls (right-aligned)
  if (isWindows) {
    return (
      <div className={`h-8 flex items-center select-none ${
        transparent ? 'bg-transparent' : 'bg-bg-secondary border-b border-theme'
      }`}>
        {/* Draggable area - invisible title for wider drag area */}
        <div className="flex-1 px-3 text-sm font-medium text-transparent" data-tauri-drag-region>
          NetMapper Pro
        </div>
        {/* Button area - NO drag region */}
        <div className="flex h-full z-10">
          <button
            onClick={handleMinimize}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className={`h-full px-4 transition-colors group cursor-pointer ${
              transparent ? 'hover:bg-slate-200/50' : 'hover:bg-bg-hover'
            }`}
            aria-label="Minimize"
          >
            <Minus className={`w-4 h-4 ${
              transparent ? 'text-slate-600' : 'text-text-secondary'
            }`} />
          </button>
          <button
            onClick={handleMaximize}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className={`h-full px-4 transition-colors group cursor-pointer ${
              transparent ? 'hover:bg-slate-200/50' : 'hover:bg-bg-hover'
            }`}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              // Restore Down - Windows 11 style (two overlapping squares)
              <svg className={`w-3.5 h-3.5 ${
                transparent ? 'text-slate-600' : 'text-text-secondary'
              }`} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="0.8">
                {/* Back square (top-left) */}
                <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="0.5" />
                {/* Front square (bottom-right) */}
                <rect x="4" y="4" width="5.5" height="5.5" rx="0.5" />
              </svg>
            ) : (
              // Maximize - Single rounded square (Windows 11 style)
              <svg className={`w-3.5 h-3.5 ${
                transparent ? 'text-slate-600' : 'text-text-secondary'
              }`} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="0.8">
                <rect x="1" y="1" width="8" height="8" rx="0.5" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className="h-full px-4 hover:bg-accent-red hover:text-white transition-colors group cursor-pointer"
            aria-label="Close"
          >
            <X className={`w-4 h-4 group-hover:text-white ${
              transparent ? 'text-slate-700' : 'text-text-secondary'
            }`} />
          </button>
        </div>
      </div>
    );
  }

  // Default/Linux - simple centered title
  return (
    <div className="h-8 bg-bg-secondary border-b border-theme flex items-center px-3 select-none" data-tauri-drag-region>
      <div className="flex-1 text-center text-sm font-medium text-text-secondary">
        NetMapper Pro
      </div>
    </div>
  );
}
