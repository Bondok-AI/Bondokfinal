import React, { memo, useEffect, useState } from 'react';

interface CelebrationProps {
  onClose: () => void;
  childName?: string;
}

// Simple confetti simulation without external library
const createConfetti = () => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  const particles: HTMLDivElement[] = [];
  
  for (let i = 0; i < 100; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 10 + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const startX = Math.random() * window.innerWidth;
    const startY = -20;
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      left: ${startX}px;
      top: ${startY}px;
      opacity: 1;
      transform: rotate(${Math.random() * 360}deg);
    `;
    
    container.appendChild(particle);
    particles.push(particle);
    
    // Animate
    const duration = Math.random() * 2000 + 2000;
    const endX = startX + (Math.random() - 0.5) * 400;
    const endY = window.innerHeight + 50;
    const rotation = Math.random() * 720;
    
    particle.animate([
      { 
        transform: `translate(0, 0) rotate(0deg)`,
        opacity: 1 
      },
      { 
        transform: `translate(${endX - startX}px, ${endY}px) rotate(${rotation}deg)`,
        opacity: 0 
      }
    ], {
      duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });
  }
  
  // Cleanup after animation
  setTimeout(() => {
    container.remove();
  }, 4000);
};

const Celebration: React.FC<CelebrationProps> = memo(({ 
  onClose,
  childName = 'بطل'
}) => {
  useEffect(() => {
    createConfetti();
    
    // Auto-close after delay (optional)
    const timer = setTimeout(() => {
      // Don't auto-close, let user dismiss
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 md:p-12 shadow-2xl border-8 border-white dark:border-slate-700 max-w-md mx-4 text-center animate-bounce-in">
        {/* Stars decoration */}
        <div className="flex justify-center gap-2 mb-4">
          <span className="text-4xl animate-pulse">⭐</span>
          <span className="text-5xl animate-bounce">🏆</span>
          <span className="text-4xl animate-pulse" style={{ animationDelay: '0.2s' }}>⭐</span>
        </div>
        
        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-black text-indigo-900 dark:text-indigo-100 mb-4">
          🎉 أحسنت يا {childName}! 🎉
        </h2>
        
        <p className="text-lg text-slate-600 dark:text-slate-300 font-bold mb-2">
          أنهيت الحكاية بنجاح!
        </p>
        <p className="text-lg text-slate-600 dark:text-slate-300 font-bold">
          أنت بطل القراءة! 📚✨
        </p>
        
        {/* Action button */}
        <button
          onClick={onClose}
          className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-lg hover:scale-105 transition-transform shadow-lg"
        >
          رائع! 🎊
        </button>
      </div>
    </div>
  );
});

Celebration.displayName = 'Celebration';

export default Celebration;
