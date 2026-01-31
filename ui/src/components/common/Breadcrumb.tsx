import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbProps {
  items: string[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <motion.div 
          key={index}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-text-muted" />
          )}
          <span 
            className={`text-sm ${
              index === items.length - 1 
                ? 'text-text-primary font-semibold' 
                : 'text-text-secondary hover:text-text-primary transition-colors cursor-pointer'
            }`}
          >
            {item}
          </span>
        </motion.div>
      ))}
    </nav>
  );
}
