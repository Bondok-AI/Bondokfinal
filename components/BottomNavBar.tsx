import React, { memo, useCallback } from 'react';
import { triggerHaptic } from '../utils/mobileUtils';
import { HomeIcon, HomeFilledIcon, LibraryIcon, LibraryFilledIcon } from './Icons';

export type NavTab = 'home' | 'library' | 'profile';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  libraryCount?: number;
  profileName?: string;
  profileAvatar?: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = memo(({
  activeTab,
  onTabChange,
  libraryCount = 0,
  profileName,
  profileAvatar = '🤖'
}) => {
  const handleTabClick = useCallback((tab: NavTab) => {
    if (tab !== activeTab) {
      triggerHaptic('light');
      onTabChange(tab);
    }
  }, [activeTab, onTabChange]);

  const tabs: Array<{
    id: NavTab;
    label: string;
    badge?: number;
  }> = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'library', label: 'المكتبة', badge: libraryCount },
    { id: 'profile', label: 'الملف' },
  ];

  const renderIcon = (tabId: NavTab, isActive: boolean) => {
    const iconSize = 22;
    const iconColor = isActive ? '#4338ca' : '#64748b';
    
    switch (tabId) {
      case 'home':
        return isActive 
          ? <HomeFilledIcon size={iconSize} color={iconColor} />
          : <HomeIcon size={iconSize} color={iconColor} />;
      case 'library':
        return isActive 
          ? <LibraryFilledIcon size={iconSize} color={iconColor} />
          : <LibraryIcon size={iconSize} color={iconColor} />;
      case 'profile':
        return (
          <div className={`
            w-7 h-7 rounded-full flex items-center justify-center text-base
            ${isActive 
              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300' 
              : 'bg-indigo-100'
            }
          `}>
            {profileAvatar}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom" role="navigation" aria-label="التنقل الرئيسي">
      {/* Glassmorphism background */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-indigo-100/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center px-4 py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[72px] min-h-[56px] py-2 px-3
                  rounded-xl transition-all duration-200 ease-out
                  ${isActive 
                    ? 'bg-indigo-50' 
                    : 'hover:bg-slate-50 active:scale-95'
                  }
                `}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Badge */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute top-0.5 right-2 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm" aria-label={`${tab.badge} قصص في المكتبة`}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
                
                {/* Icon container */}
                <div className={`
                  transition-transform duration-200
                  ${isActive ? 'scale-110' : ''}
                `}>
                  {renderIcon(tab.id, isActive)}
                </div>
                
                {/* Label */}
                <span className={`
                  text-[11px] font-bold mt-1 transition-colors duration-200
                  ${isActive 
                    ? 'text-indigo-700' 
                    : 'text-slate-500'
                  }
                `}>
                  {tab.id === 'profile' && profileName 
                    ? (profileName.length > 6 ? profileName.slice(0, 6) + '..' : profileName)
                    : tab.label
                  }
                </span>
                
                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute bottom-1 w-6 h-0.5 bg-indigo-600 rounded-full" />
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
});

BottomNavBar.displayName = 'BottomNavBar';

export default BottomNavBar;
