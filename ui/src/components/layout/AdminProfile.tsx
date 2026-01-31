import { User, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminProfileProps {
  avatar?: string;
  name?: string;
  license?: string;
  isCollapsed?: boolean;
}

export default function AdminProfile({ 
  avatar, 
  name = "Admin User", 
  license = "Pro License",
  isCollapsed = false
}: AdminProfileProps) {
  return (
    <motion.div 
      className="mt-auto border-t border-theme p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        {/* Avatar */}
        <div className="relative group">
          {avatar ? (
            <img 
              src={avatar} 
              alt={name}
              className="w-10 h-10 rounded-full object-cover border-2 border-bg-tertiary"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-accent-green border-2 border-bg-secondary rounded-full"></span>
          
          {/* Tooltip when collapsed */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 bottom-0 px-3 py-2 bg-bg-elevated border border-theme rounded-md
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                            whitespace-nowrap text-sm shadow-lg z-50">
              <p className="text-text-primary font-semibold">{name}</p>
              <span className="text-xs text-accent-purple">{license}</span>
            </div>
          )}
        </div>
        
        {/* User Info - Hidden when collapsed */}
        <AnimatePresence>
          {!isCollapsed && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-text-primary truncate">
                  {name}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-purple/10 text-accent-purple">
                  {license}
                </span>
              </motion.div>
              
              {/* Menu Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="User menu"
              >
                <MoreVertical className="w-4 h-4 text-text-secondary" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
