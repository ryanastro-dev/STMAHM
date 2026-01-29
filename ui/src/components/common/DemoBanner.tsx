import { AlertCircle, X } from 'lucide-react';
import { useDemoMode } from '../../hooks/useDemoMode';


export default function DemoBanner() {
  const { isDemoMode, setDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-accent-amber/20 to-accent-yellow/20 border-b border-accent-amber/30 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-accent-amber" />
          <div>
            <p className="text-sm font-semibold text-accent-amber">
              Demo Mode Active
            </p>
            <p className="text-xs text-text-secondary">
              Using pre-loaded sample data for demonstration
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setDemoMode(false)}
          className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-bg-hover text-text-primary rounded-lg text-sm font-medium transition-colors"
        >
          <X className="w-4 h-4" />
          Exit Demo Mode
        </button>
      </div>
    </div>
  );
}
