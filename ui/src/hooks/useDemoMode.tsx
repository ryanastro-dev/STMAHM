import { useState, useEffect } from 'react';

const DEMO_MODE_KEY = 'demo-mode-enabled';

export function useDemoMode() {
  const [isDemoMode, setIsDemoModeState] = useState(() => {
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(DEMO_MODE_KEY, String(isDemoMode));
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoModeState(prev => !prev);
  };

  const setDemoMode = (enabled: boolean) => {
    setIsDemoModeState(enabled);
  };

  return {
    isDemoMode,
    toggleDemoMode,
    setDemoMode,
  };
}
