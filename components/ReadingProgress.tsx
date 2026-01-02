import React, { memo } from 'react';

interface ReadingProgressProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

const ReadingProgress: React.FC<ReadingProgressProps> = memo(({ 
  currentPage, 
  totalPages,
  className = ''
}) => {
  const progress = totalPages > 0 ? ((currentPage) / totalPages) * 100 : 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar container */}
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
        {/* Animated progress fill */}
        <div 
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
        
        {/* Page markers */}
        <div className="absolute inset-0 flex justify-between px-0.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              className={`w-0.5 h-full transition-colors duration-300 ${
                i < currentPage 
                  ? 'bg-white/50' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Text indicator */}
      <div className="flex justify-between items-center mt-1 text-xs font-bold">
        <span className="text-slate-500 dark:text-slate-400">
          {currentPage} / {totalPages}
        </span>
        <span className="text-indigo-600 dark:text-indigo-400">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
});

ReadingProgress.displayName = 'ReadingProgress';

export default ReadingProgress;
