import { motion } from 'framer-motion';
import { Lock, Unlock, Zap, Grid3x3, Share2 } from 'lucide-react';

export type MappingDesign = 'default' | 'cyber' | 'mesh';

interface TopologyControlsProps {
  isLocked: boolean;
  onLockToggle: () => void;
  mappingDesign: MappingDesign;
  onDesignChange: (design: MappingDesign) => void;
}

export default function TopologyControls({
  isLocked,
  onLockToggle,
  mappingDesign,
  onDesignChange,
}: TopologyControlsProps) {
  
  const getButtonClass = (isActive: boolean, isLock?: boolean) => {
    const base = 'flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-200';
    
    if (isLock && isActive) {
      return `${base} bg-orange-500/20 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400`;
    }
    
    if (isActive) {
      return `${base} bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300`;
    }
    
    return `${base} bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50`;
  };

  return (
    <motion.div
      className="absolute left-4 top-4 z-10 flex items-center gap-1 p-1.5 
                 bg-white/95 dark:bg-slate-900/95 
                 rounded-xl 
                 border border-slate-200/50 dark:border-slate-700/50 
                 backdrop-blur-xl 
                 shadow-lg dark:shadow-2xl dark:shadow-black/40
                 transition-colors duration-300"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Theme Buttons */}
      <button
        onClick={() => onDesignChange('default')}
        title="Standard Theme"
        className={getButtonClass(mappingDesign === 'default')}
      >
        <Grid3x3 size={16} />
      </button>
      
      <button
        onClick={() => onDesignChange('cyber')}
        title="Cyber Theme"
        className={getButtonClass(mappingDesign === 'cyber')}
      >
        <Zap size={16} />
      </button>
      
      <button
        onClick={() => onDesignChange('mesh')}
        title="Mesh Theme"
        className={getButtonClass(mappingDesign === 'mesh')}
      >
        <Share2 size={16} />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Lock Button */}
      <button
        onClick={onLockToggle}
        title={isLocked ? 'Unlock nodes' : 'Lock nodes'}
        className={getButtonClass(isLocked, true)}
      >
        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
    </motion.div>
  );
}
