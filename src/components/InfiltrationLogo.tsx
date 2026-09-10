import React from 'react';

interface InfiltrationLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  showText?: boolean;
  withGlow?: boolean;
  animated?: boolean;
}

export const InfiltrationLogo: React.FC<InfiltrationLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  withGlow = true,
  animated = false,
}) => {
  const [logoSrc, setLogoSrc] = React.useState<string>('/assets/infiltration-logo.png');

  React.useEffect(() => {
    // Check if user has uploaded a custom infiltration-logo.png
    const testPng = new Image();
    testPng.onload = () => {
      if (testPng.naturalWidth > 0 && testPng.naturalHeight > 0) {
        setLogoSrc('/assets/infiltration-logo.png');
      }
    };
    testPng.src = '/assets/infiltration-logo.png';
  }, []);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-36 h-36 sm:w-44 sm:h-44',
    custom: '',
  }[size];

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
    >
      <div
        className={`relative flex items-center justify-center ${sizeClasses} ${
          withGlow
            ? 'drop-shadow-[0_0_12px_rgba(220,38,38,0.55)] hover:drop-shadow-[0_0_18px_rgba(239,68,68,0.85)]'
            : ''
        } ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
      >
        <img
          src={logoSrc}
          onError={() => {
            if (logoSrc !== '/assets/infiltration-logo.svg') {
              setLogoSrc('/assets/infiltration-logo.svg');
            }
          }}
          alt="Infiltration Tactical Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
        />
      </div>

      {showText && (
        <div className="mt-1 text-center font-mono">
          <span className="text-white font-black tracking-widest text-xs uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            INFILTRATION
          </span>
          <span className="block text-[8px] text-red-500 tracking-wider font-bold">
            OPERACIÓN ROGUE // AGENTE 077
          </span>
        </div>
      )}
    </div>
  );
};

export default InfiltrationLogo;
