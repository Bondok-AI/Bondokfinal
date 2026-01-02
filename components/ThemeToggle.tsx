import React, { memo, useCallback } from 'react';

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  onToggle: () => void;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = memo(({ 
  theme, 
  resolvedTheme, 
  onToggle, 
  className = '' 
}) => {
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={onToggle}
      className={`
        relative w-14 h-8 rounded-full p-1
        transition-all duration-300 ease-out
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400
        ${isDark 
          ? 'bg-indigo-900 shadow-inner' 
          : 'bg-amber-100 shadow-md'
        }
        ${className}
      `}
      aria-label={isDark ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
      aria-pressed={isDark}
      role="switch"
    >
      {/* Track decoration */}
      <div className={`
        absolute inset-0 rounded-full overflow-hidden
        transition-opacity duration-300
        ${isDark ? 'opacity-100' : 'opacity-0'}
      `}>
        {/* Stars */}
        <div className="absolute top-1.5 left-2 w-1 h-1 bg-white/60 rounded-full" />
        <div className="absolute top-3 left-4 w-0.5 h-0.5 bg-white/40 rounded-full" />
        <div className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white/50 rounded-full" />
      </div>

      {/* Toggle knob */}
      <div
        className={`
          w-6 h-6 rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-out
          shadow-md
          ${isDark 
            ? 'translate-x-6 bg-indigo-100' 
            : 'translate-x-0 bg-amber-400'
          }
        `}
      >
        {/* Sun/Moon icon */}
        {isDark ? (
          <svg className="w-4 h-4 text-indigo-900" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-amber-100" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
