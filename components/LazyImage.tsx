import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src?: string;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
  loadingText?: string;
  showSpinner?: boolean;
}

/**
 * Lazy-loaded image component with blur-up placeholder effect
 * - Shows skeleton/spinner while loading
 * - Smooth fade-in transition when loaded
 * - Handles missing/error images gracefully
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = '',
  className = '',
  placeholderClassName = '',
  loadingText = 'جاري التحميل...',
  showSpinner = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.1
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // No source provided - show placeholder
  if (!src) {
    return (
      <div 
        ref={containerRef}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 ${placeholderClassName}`}
      >
        {showSpinner && (
          <>
            <div className="w-16 h-16 border-[5px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-indigo-400 text-lg animate-pulse text-center px-4">{loadingText}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${placeholderClassName}`}>
      {/* Skeleton placeholder */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-indigo-100 transition-opacity duration-500 ${
          isLoaded && !hasError ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {showSpinner && !isLoaded && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-[5px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-indigo-400 text-lg animate-pulse text-center px-4">{loadingText}</p>
          </div>
        )}
        {hasError && (
          <div className="flex flex-col items-center justify-center h-full text-indigo-300">
            <span className="text-5xl mb-2">🖼️</span>
            <p className="font-bold text-sm">لم نتمكن من تحميل الصورة</p>
          </div>
        )}
      </div>

      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-500 ${
            isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      )}
    </div>
  );
};

export default LazyImage;
