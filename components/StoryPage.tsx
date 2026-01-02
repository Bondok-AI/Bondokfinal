
import React, { useState, useEffect, useRef } from 'react';
import { Page, PageChoice } from '../types';
import { decodeBase64, decodeAudioData, speakWithBrowser } from '../services/geminiService';
import LazyImage from './LazyImage';

interface StoryPageProps {
  page: Page | undefined;
  pageNumber: number;
  totalPages?: number;
  autoStart?: boolean;
  onEnded?: () => void;
  onChoiceSelected?: (choice: PageChoice) => void;
  isChoiceLoading?: boolean;
  onSwipeLeft?: () => void;  // التالي
  onSwipeRight?: () => void; // السابق
  canSwipeLeft?: boolean;
  canSwipeRight?: boolean;
}

// Minimum swipe distance to trigger navigation (in pixels)
const SWIPE_THRESHOLD = 50;
// Maximum time for a swipe gesture (in ms)
const SWIPE_TIME_LIMIT = 300;

const StoryPage: React.FC<StoryPageProps> = ({
  page,
  pageNumber,
  totalPages = 1,
  autoStart,
  onEnded,
  onChoiceSelected,
  isChoiceLoading,
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft = true,
  canSwipeRight = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playRequestIdRef = useRef<number>(0);
  const fallbackTimeoutRef = useRef<number>(0);

  // Swipe gesture state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Haptic feedback helper
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 };
      navigator.vibrate(patterns[style]);
    }
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (deltaY > Math.abs(deltaX)) {
      return;
    }
    
    // Limit the swipe offset with resistance at edges
    const maxOffset = 150;
    const resistance = 0.5;
    let offset = deltaX;
    
    // Apply resistance when can't swipe in that direction
    if ((deltaX > 0 && !canSwipeRight) || (deltaX < 0 && !canSwipeLeft)) {
      offset = deltaX * resistance * 0.3;
    }
    
    setSwipeOffset(Math.max(-maxOffset, Math.min(maxOffset, offset)));
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;
    
    const deltaTime = Date.now() - touchStartRef.current.time;
    const isQuickSwipe = deltaTime < SWIPE_TIME_LIMIT;
    
    // Determine if swipe should trigger navigation
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD || (isQuickSwipe && Math.abs(swipeOffset) > 30)) {
      if (swipeOffset < 0 && canSwipeLeft && onSwipeLeft) {
        // Swiped left -> go to next page (RTL: left is forward)
        triggerHaptic('medium');
        onSwipeLeft();
      } else if (swipeOffset > 0 && canSwipeRight && onSwipeRight) {
        // Swiped right -> go to previous page (RTL: right is backward)
        triggerHaptic('medium');
        onSwipeRight();
      }
    }
    
    // Reset swipe state
    setSwipeOffset(0);
    setIsSwiping(false);
    touchStartRef.current = null;
  };

  const stopAudio = () => {
    playRequestIdRef.current += 1;
    if (fallbackTimeoutRef.current) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = 0;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.onended = null;
        sourceRef.current.stop();
      } catch (e) { }
      sourceRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (!page?.text_ar) return;

    const requestId = ++playRequestIdRef.current;

    if (isPlaying) {
      stopAudio();
      if (!autoStart) return;
    }

    if (page.audioData) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        if (requestId !== playRequestIdRef.current) return;

        const bytes = decodeBase64(page.audioData);
        if (bytes.length === 0) throw new Error("Invalid audio data");

        const buffer = await decodeAudioData(bytes, audioContextRef.current);
        if (requestId !== playRequestIdRef.current) return;

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          if (requestId === playRequestIdRef.current) {
            setIsPlaying(false);
            if (onEnded) onEnded();
          }
        };
        sourceRef.current = source;
        source.start(0);
        setIsPlaying(true);
      } catch (e) {
        handleBrowserFallback(requestId);
      }
    } else {
      handleBrowserFallback(requestId);
    }
  };

  const handleBrowserFallback = (requestId: number) => {
    if (!page?.text_ar) return;
    speakWithBrowser(page.text_ar);
    setIsPlaying(true);

    const duration = Math.max(3000, page.text_ar.length * 100);
    fallbackTimeoutRef.current = window.setTimeout(() => {
      if (requestId === playRequestIdRef.current) {
        setIsPlaying(false);
        if (onEnded) onEnded();
      }
    }, duration);
  };

  useEffect(() => {
    stopAudio();
    let timer: number = 0;

    // Only auto-start if page has audio data ready OR if there's text but no audio (fallback case)
    const hasAudio = page?.audioData || (page?.text_ar && !page?.audioData);

    if (autoStart && page && hasAudio) {
      // Reduced delay for snappier automatic progression
      timer = window.setTimeout(playAudio, 800);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      stopAudio();
    };
  }, [pageNumber, autoStart, !!page?.audioData]);

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[4rem] shadow-2xl border-8 border-white min-h-[500px] w-full max-w-5xl mx-auto">
        <div className="w-16 h-16 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-8 text-3xl font-black text-slate-400 text-center">جاري استحضار الحكاية السحرية...</p>
      </div>
    );
  }

  const hasChoices = page.choices && page.choices.length > 0;
  const isLocked = !!page.chosenChoiceId;

  // Swipe indicator visibility
  const showLeftIndicator = isSwiping && swipeOffset < -20 && canSwipeLeft;
  const showRightIndicator = isSwiping && swipeOffset > 20 && canSwipeRight;

  return (
    <div
      className="relative touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe direction indicators */}
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 transition-all duration-200 ${showRightIndicator ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <div className="bg-indigo-600 text-white p-4 rounded-full shadow-xl">
          <span className="text-2xl">→</span>
        </div>
      </div>
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 transition-all duration-200 ${showLeftIndicator ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <div className="bg-indigo-600 text-white p-4 rounded-full shadow-xl">
          <span className="text-2xl">←</span>
        </div>
      </div>

      <div 
        className="page-transition-enter flex flex-col items-center bg-white rounded-[4rem] shadow-2xl p-6 md:p-12 max-w-5xl w-full mx-auto border-8 border-white relative ring-8 ring-indigo-50/50 transition-transform duration-100"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-xl z-10 animate-sparkle">✨</div>

      <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden bg-indigo-50 border-4 border-indigo-100 group shadow-inner">
        <LazyImage 
          src={page.imageUrl} 
          alt="" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          placeholderClassName="w-full h-full"
          loadingText="بندوق يرسم اللوحة السحرية لهذا المشهد..."
          showSpinner={true}
        />
      </div>

      <div className="mt-12 text-center space-y-10 w-full">
        <div className="inline-flex items-center gap-4 bg-indigo-50 px-10 py-3 rounded-full border-2 border-indigo-100 shadow-sm">
          <span className="text-indigo-700 font-black text-xl">الصفحة {pageNumber}</span>
        </div>

        <div className="min-h-[200px] flex items-center justify-center px-4 md:px-16 bg-slate-50/50 rounded-[3rem] border-4 border-white shadow-inner">
          <p className="text-2xl md:text-3xl leading-[1.8] text-slate-800 font-bold whitespace-pre-wrap">{page.text_ar}</p>
        </div>

        {hasChoices && (
          <div className="space-y-6 pt-4">
            <p className="text-2xl font-black text-indigo-600">ماذا تختار أن يفعل بطلنا الآن؟ 🤔</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {page.choices?.map((choice) => (
                <button
                  key={choice.id}
                  disabled={isLocked || isChoiceLoading}
                  onClick={() => onChoiceSelected?.(choice)}
                  className={`p-6 rounded-3xl font-black text-xl transition-all shadow-lg border-4 ${page.chosenChoiceId === choice.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : isLocked
                        ? 'bg-slate-100 text-slate-400 border-slate-100 opacity-50'
                        : 'bg-white text-indigo-700 border-indigo-100 hover:scale-105 hover:border-indigo-400'
                    }`}
                >
                  {choice.text_ar}
                </button>
              ))}
            </div>
            {isChoiceLoading && (
              <div className="flex items-center justify-center gap-3 text-indigo-400 font-bold animate-pulse">
                <div className="w-4 h-4 bg-indigo-400 rounded-full animate-bounce"></div>
                <span>جاري متابعة القصة حسب اختيارك...</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={playAudio}
            className={`group flex items-center gap-6 px-16 py-8 rounded-[3rem] font-black text-3xl transition-all transform active:scale-95 shadow-2xl ${isPlaying ? 'bg-rose-500 text-white shadow-[0_12px_0_#be123c]' : 'bg-emerald-500 text-white shadow-[0_12px_0_#047857]'
              }`}
          >
            {isPlaying ? (
              <div className="flex items-center gap-3">
                <span className="animate-pulse">⏹️</span> إيقاف
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span>🔊</span> استمع للحكاية
              </div>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default StoryPage;
