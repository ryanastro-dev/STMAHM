interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className = "w-6 h-6" }: LogoIconProps) {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Network topology forming 'N' shape */}
      <g opacity="0.9">
        {/* Connection lines */}
        <line x1="20" y1="20" x2="20" y2="80" stroke="white" strokeWidth="3" strokeOpacity="0.6"/>
        <line x1="20" y1="20" x2="50" y2="50" stroke="white" strokeWidth="3" strokeOpacity="0.7"/>
        <line x1="50" y1="50" x2="80" y2="80" stroke="white" strokeWidth="3" strokeOpacity="0.7"/>
        <line x1="80" y1="20" x2="80" y2="80" stroke="white" strokeWidth="3" strokeOpacity="0.6"/>
        <line x1="20" y1="20" x2="80" y2="20" stroke="white" strokeWidth="2" strokeOpacity="0.5"/>
        <line x1="20" y1="80" x2="80" y2="80" stroke="white" strokeWidth="2" strokeOpacity="0.5"/>
        
        {/* Node circles */}
        <circle cx="20" cy="20" r="7" fill="white" opacity="0.95"/>
        <circle cx="80" cy="20" r="7" fill="white" opacity="0.95"/>
        <circle cx="50" cy="50" r="6" fill="white" opacity="0.9"/>
        <circle cx="20" cy="80" r="7" fill="white" opacity="0.95"/>
        <circle cx="80" cy="80" r="7" fill="white" opacity="0.95"/>
        
        {/* Inner glow circles */}
        <circle cx="20" cy="20" r="3" fill="#E0E7FF"/>
        <circle cx="80" cy="20" r="3" fill="#E0E7FF"/>
        <circle cx="50" cy="50" r="2.5" fill="#E0E7FF"/>
        <circle cx="20" cy="80" r="3" fill="#E0E7FF"/>
        <circle cx="80" cy="80" r="3" fill="#E0E7FF"/>
      </g>
    </svg>
  );
}
