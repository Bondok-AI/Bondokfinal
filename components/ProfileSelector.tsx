
import React from 'react';
import { ChildProfile } from '../types';

interface ProfileSelectorProps {
  profiles: ChildProfile[];
  onSelect: (profile: ChildProfile) => void;
  onManage: () => void;
}

const avatars = ['🤖', '🦁', '🦉', '🚀', '🌈', '🦄'];

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, onSelect, onManage }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-50 to-white z-[70] flex flex-col items-center justify-center p-4 md:p-6 text-center overflow-y-auto safe-top safe-bottom">
      <h1 className="text-3xl md:text-5xl font-black text-indigo-900 mb-8 md:mb-12 tracking-tight">
        اختر ملفك الشخصي ✨
      </h1>
      
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-4xl">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="group flex flex-col items-center space-y-3 hover:scale-105 active:scale-95 transition-all"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center text-5xl md:text-7xl shadow-lg border-4 border-white ring-4 ring-indigo-100 group-hover:ring-indigo-400 group-active:ring-indigo-500 transition-all">
              {p.avatar}
            </div>
            <span className="text-xl md:text-2xl font-black text-slate-800">{p.name}</span>
          </button>
        ))}
        
        <button
          onClick={onManage}
          className="flex flex-col items-center space-y-3 hover:scale-105 active:scale-95 transition-all"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center text-4xl md:text-5xl shadow-lg border-4 border-white ring-4 ring-slate-100 text-indigo-400 hover:text-indigo-600 transition-colors">
            ➕
          </div>
          <span className="text-lg md:text-xl font-bold text-slate-400">إضافة ملف</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileSelector;
