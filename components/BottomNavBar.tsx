import React from 'react';
import { triggerHaptic } from '../utils/mobileUtils';

export type NavTab = 'home' | 'library' | 'profile';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  libraryCount?: number;
  profileName?: string;
  profileAvatar?: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  libraryCount = 0,
  profileName,
  profileAvatar = '🤖'
}) => {
  const handleTabClick = (tab: NavTab) => {
    if (tab !== activeTab) {
      triggerHaptic('light');
      onTabChange(tab);
    }
  };

  const tabs: Array<{
    id: NavTab;
    icon: string;
    activeIcon: string;
    label: string;
    badge?: number;
  }> = [
    { id: 'home', icon: '🏠', activeIcon: '✨', label: 'الرئيسية' },
    { id: 'library', icon: '📚', activeIcon: '📖', label: 'المكتبة', badge: libraryCount },
    { id: 'profile', icon: '👤', activeIcon: '⭐', label: 'الملف' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Glassmorphism background */}
      <div className="bg-white/90 backdrop-blur-xl border-t-2 border-indigo-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center px-2 py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[70px] min-h-[60px] py-2 px-3
                  rounded-2xl transition-all duration-300 ease-out
                  ${isActive 
                    ? 'bg-indigo-100 scale-105' 
                    : 'hover:bg-indigo-50 active:scale-95'
                  }
                `}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Badge */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-rose-500 text-white text-xs font-black rounded-full flex items-center justify-center px-1 shadow-lg animate-bounce">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
                
                {/* Icon container with animation */}
                <div className={`
                  text-2xl transition-all duration-300
                  ${isActive ? 'scale-110 -translate-y-1' : ''}
                `}>
                  {/* Profile tab shows avatar */}
                  {tab.id === 'profile' ? (
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xl
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300' 
                        : 'bg-indigo-100'
                      }
                    `}>
                      {profileAvatar}
                    </div>
                  ) : (
                    <span className={isActive ? 'animate-pulse' : ''}>
                      {isActive ? tab.activeIcon : tab.icon}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className={`
                  text-xs font-black mt-1 transition-all duration-300
                  ${isActive 
                    ? 'text-indigo-700' 
                    : 'text-slate-400'
                  }
                `}>
                  {tab.id === 'profile' && profileName 
                    ? (profileName.length > 6 ? profileName.slice(0, 6) + '..' : profileName)
                    : tab.label
                  }
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Safe area spacer for devices with home indicator */}
        <div className="h-safe-bottom" />
      </div>
    </nav>
  );
};

export default BottomNavBar;
