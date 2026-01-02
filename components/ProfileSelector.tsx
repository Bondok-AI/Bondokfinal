
import React, { memo, useCallback } from 'react';
import { ChildProfile } from '../types';
import { PlusIcon, SettingsIcon } from './Icons';

interface ProfileSelectorProps {
  profiles: ChildProfile[];
  onSelect: (profile: ChildProfile) => void;
  onManage: () => void;
}

const avatars = ['🤖', '🦁', '🦉', '🚀', '🌈', '🦄'];

const ProfileSelector: React.FC<ProfileSelectorProps> = memo(({ profiles, onSelect, onManage }) => {
  const handleSelect = useCallback((profile: ChildProfile) => {
    onSelect(profile);
  }, [onSelect]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-50 to-white z-[70] flex flex-col items-center justify-center p-4 md:p-6 text-center overflow-y-auto safe-top safe-bottom">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>
      
      <h1 className="relative text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-indigo-900 mb-6 sm:mb-8 md:mb-16 tracking-tight">
        اختر ملفك الشخصي ✨
      </h1>
      
      <div className="relative grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap justify-center gap-4 sm:gap-6 md:gap-10 max-w-4xl w-full">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => handleSelect(p)}
            aria-label={`اختيار ملف ${p.name}`}
            className="group flex flex-col items-center space-y-2 md:space-y-4 hover:scale-105 md:hover:scale-110 transition-all duration-200 focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 rounded-3xl p-2"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 lg:w-40 md:h-32 lg:h-40 bg-white rounded-full flex items-center justify-center text-4xl sm:text-5xl md:text-6xl lg:text-8xl shadow-lg md:shadow-xl border-4 md:border-8 border-white ring-4 ring-indigo-100 group-hover:ring-indigo-400 group-hover:shadow-2xl transition-all duration-200">
              {p.avatar}
            </div>
            <span className="text-base sm:text-lg md:text-2xl lg:text-3xl font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{p.name}</span>
          </button>
        ))}
        
        <button
          onClick={onManage}
          aria-label="إدارة الملفات الشخصية"
          className="group flex flex-col items-center space-y-2 md:space-y-4 hover:scale-105 md:hover:scale-110 transition-all duration-200 focus-visible:ring-4 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-3xl p-2"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 lg:w-40 md:h-32 lg:h-40 bg-white rounded-full flex items-center justify-center shadow-lg md:shadow-xl border-4 md:border-8 border-white ring-4 ring-slate-200 group-hover:ring-slate-400 transition-all duration-200">
            <PlusIcon size={32} className="text-slate-400 group-hover:text-slate-600 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 transition-colors" />
          </div>
          <span className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-slate-500 group-hover:text-slate-700 transition-colors">إدارة الملفات</span>
        </button>
      </div>
    </div>
  );
});

ProfileSelector.displayName = 'ProfileSelector';

export default ProfileSelector;
