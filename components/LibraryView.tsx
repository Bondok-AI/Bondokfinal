
import React, { useState, useMemo, memo, useCallback } from 'react';
import { Story } from '../types';
import { SearchIcon, CloseIcon, BookOpenIcon } from './Icons';

interface LibraryViewProps {
  stories: Story[];
  onSelect: (story: Story) => void;
  onClose: () => void;
}

const LibraryView: React.FC<LibraryViewProps> = memo(({ stories, onSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Memoized filtered and sorted stories
  const filteredStories = useMemo(() => {
    const sorted = [...stories].sort((a, b) => b.createdAt - a.createdAt);
    
    if (!searchQuery.trim()) return sorted;
    
    const query = searchQuery.trim().toLowerCase();
    return sorted.filter(story => 
      story.title.toLowerCase().includes(query) ||
      story.character?.name_ar?.includes(query)
    );
  }, [stories, searchQuery]);

  const handleSelect = useCallback((story: Story) => {
    onSelect(story);
  }, [onSelect]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 md:p-10 bg-indigo-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-6xl h-full max-h-[95vh] sm:max-h-[90vh] rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-4 sm:border-8 md:border-[12px] border-white ring-4 sm:ring-8 ring-indigo-400/20">
        {/* Header */}
        <div className="p-4 sm:p-6 md:p-8 border-b-2 sm:border-b-4 border-indigo-50 flex flex-col gap-4 bg-gradient-to-b from-indigo-50/80 to-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <BookOpenIcon size={28} className="text-indigo-600 hidden sm:block" />
              <span className="text-3xl sm:hidden">📚</span>
              <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-indigo-900">مكتبتي السحرية</h2>
            </div>
            <button 
              onClick={onClose}
              aria-label="إغلاق المكتبة"
              className="p-2 sm:p-3 md:p-4 bg-white rounded-xl sm:rounded-2xl shadow-md hover:bg-rose-50 hover:text-rose-500 transition-all focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <CloseIcon size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
          
          {/* Search Bar */}
          {stories.length > 0 && (
            <div className="relative">
              <SearchIcon size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في حكاياتك..."
                className="w-full pr-12 pl-10 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all"
                aria-label="البحث في المكتبة"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                  aria-label="مسح البحث"
                >
                  <CloseIcon size={18} className="text-slate-500" />
                </button>
              )}
            </div>
          )}
          
          {/* Results count */}
          {searchQuery && (
            <p className="text-sm text-slate-500 font-bold">
              {filteredStories.length === 0 
                ? 'لا توجد نتائج' 
                : `تم العثور على ${filteredStories.length} ${filteredStories.length === 1 ? 'حكاية' : 'حكايات'}`
              }
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {stories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 px-4">
              <div className="text-6xl sm:text-7xl md:text-9xl opacity-30">📖</div>
              <p className="text-lg sm:text-xl md:text-3xl font-bold text-slate-500">لا توجد حكايات في مكتبتك بعد...</p>
              <button 
                onClick={onClose}
                className="bg-indigo-600 text-white px-6 sm:px-8 md:px-10 py-3 md:py-4 rounded-full font-black text-base sm:text-lg md:text-xl hover:scale-105 transition-all shadow-lg focus-visible:ring-4 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
              >
                اصنع أول حكاية الآن! ✨
              </button>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
              <div className="text-6xl opacity-30">🔍</div>
              <p className="text-lg sm:text-xl font-bold text-slate-500">لم نجد حكايات تطابق "{searchQuery}"</p>
              <button 
                onClick={clearSearch}
                className="text-indigo-600 font-bold hover:underline"
              >
                مسح البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {filteredStories.map(story => (
                <button
                  key={story.id}
                  onClick={() => handleSelect(story)}
                  className="group relative bg-white border-2 sm:border-4 border-indigo-50 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden hover:border-indigo-400 hover:scale-[1.02] transition-all shadow-lg sm:shadow-xl text-right flex flex-col focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                >
                  <div className="aspect-[4/3] bg-indigo-100 relative">
                    {story.pages[0]?.imageUrl ? (
                      <img 
                        src={story.pages[0].imageUrl} 
                        alt={story.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-opacity duration-300" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl bg-gradient-to-br from-indigo-100 to-purple-100">
                        <div className="text-center">
                          <span className="text-4xl sm:text-5xl block mb-2">🎨</span>
                          <span className="text-indigo-300 text-xs sm:text-sm font-bold">بدون صورة</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3 sm:p-4 md:p-6">
                       <span className="text-white font-black text-base sm:text-lg md:text-xl line-clamp-2 drop-shadow-lg">{story.title}</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6 flex justify-between items-center gap-2">
                    <span className="text-slate-600 font-bold text-xs sm:text-sm md:text-base">
                      {new Date(story.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 sm:px-3 md:px-4 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-black whitespace-nowrap">
                      {story.pages.length} صفحات
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LibraryView.displayName = 'LibraryView';

export default LibraryView;
