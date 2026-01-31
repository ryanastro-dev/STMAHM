import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface FABProps {
  actions?: FABAction[];
}

export default function FAB({ actions = [] }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      {/* Action Menu */}
      <AnimatePresence>
        {isOpen && actions.length > 0 && (
          <motion.div
            className="absolute right-16 top-0 space-y-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                className="flex items-center gap-3 px-4 py-2 bg-bg-elevated border border-theme rounded-lg shadow-lg hover:shadow-xl transition-all whitespace-nowrap group"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-accent-purple group-hover:scale-110 transition-transform">
                  {action.icon}
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        className="w-14 h-14 bg-gradient-to-br from-accent-purple to-accent-blue text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick actions menu"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
