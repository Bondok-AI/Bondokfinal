
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
    <div className="fixed inset-0 bg-white z-[70] flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      <h1 className="text-6xl font-black text-indigo-900 mb-16 tracking-tight">اختر ملفك الشخصي ✨</h1>
      
      <div className="flex flex-wrap justify-center gap-10 max-w-4xl">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="group flex flex-col items-center space-y-4 hover:scale-110 transition-all"
          >
            <div className="w-40 h-40 bg-indigo-50 rounded-full flex items-center justify-center text-8xl shadow-xl border-8 border-white ring-4 ring-indigo-100 group-hover:ring-indigo-400 transition-all">
              {p.avatar}
            </div>
            <span className="text-3xl font-black text-slate-800">{p.name}</span>
          </button>
        ))}
        
        <button
          onClick={onManage}
          className="flex flex-col items-center space-y-4 hover:scale-110 transition-all"
        >
          <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center text-6xl shadow-xl border-8 border-white ring-4 ring-slate-100 text-slate-300">
            ➕
          </div>
          <span className="text-2xl font-black text-slate-400">إدارة الملفات</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileSelector;
