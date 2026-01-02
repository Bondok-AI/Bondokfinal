
import React from 'react';
import { Story } from '../types';

interface LibraryViewProps {
  stories: Story[];
  onSelect: (story: Story) => void;
  onClose: () => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ stories, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-indigo-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-[12px] border-white ring-8 ring-indigo-400/20">
        <div className="p-8 border-b-4 border-indigo-50 flex justify-between items-center bg-indigo-50/50">
          <div className="flex items-center gap-4">
            <span className="text-5xl">📚</span>
            <h2 className="text-4xl font-black text-indigo-900">مكتبتي السحرية</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-white rounded-2xl shadow-md hover:bg-rose-50 hover:text-rose-500 transition-all text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {stories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="text-9xl opacity-20">📖</div>
              <p className="text-3xl font-bold text-slate-400">لا توجد حكايات في مكتبتك بعد...</p>
              <button 
                onClick={onClose}
                className="bg-indigo-600 text-white px-10 py-4 rounded-full font-black text-xl hover:scale-105 transition-all shadow-lg"
              >
                اصنع أول حكاية الآن!
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.sort((a,b) => b.createdAt - a.createdAt).map(story => (
                <button
                  key={story.id}
                  onClick={() => onSelect(story)}
                  className="group relative bg-white border-4 border-indigo-50 rounded-[2.5rem] overflow-hidden hover:border-indigo-400 hover:scale-[1.02] transition-all shadow-xl text-right flex flex-col"
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
                          <span className="text-5xl block mb-2">🎨</span>
                          <span className="text-indigo-300 text-sm font-bold">بدون صورة</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                       <span className="text-white font-black text-xl line-clamp-2">{story.title}</span>
                    </div>
                  </div>
                  <div className="p-6 flex justify-between items-center">
                    <span className="text-slate-400 font-bold">
                      {new Date(story.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                    <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-black">
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
};

export default LibraryView;
