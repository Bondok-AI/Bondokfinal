
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Story, Page, ChildProfile, ParentConfig, PageChoice } from './types';
import { generateStoryStructure, generateIllustration, generateSpeech, suggestStoryTopics, generateNextPageFromChoice } from './services/geminiService';
import { storePageAssets, hydrateStoryAssets } from './services/storageService';
import StoryPage from './components/StoryPage';
import AssistantChat from './components/AssistantChat';
import LibraryView from './components/LibraryView';
import ProfileSelector from './components/ProfileSelector';
import ParentGate from './components/ParentGate';

const App: React.FC = () => {
  const [currentProfile, setCurrentProfile] = useState<ChildProfile | null>(null);
  const [profiles, setProfiles] = useState<ChildProfile[]>(() => {
    try {
      const saved = localStorage.getItem('bandooq_profiles');
      return saved ? JSON.parse(saved) : [{ id: 'default', name: 'بطل القصة', avatar: '🤖', library: [] }];
    } catch {
      return [{ id: 'default', name: 'بطل القصة', avatar: '🤖', library: [] }];
    }
  });

  const [parentConfig, setParentConfig] = useState<ParentConfig>(() => {
    try {
      const saved = localStorage.getItem('bandooq_parent');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration: if old format (has 'pin' field), reset to force setup
        if ('pin' in parsed && !('pinHash' in parsed)) {
          return { pinHash: '', isSetup: false, failedAttempts: 0, lockUntil: 0 };
        }
        return parsed;
      }
      return { pinHash: '', isSetup: false, failedAttempts: 0, lockUntil: 0 };
    } catch {
      return { pinHash: '', isSetup: false, failedAttempts: 0, lockUntil: 0 };
    }
  });

  const [topic, setTopic] = useState('');
  const [pageCount, setPageCount] = useState(5);
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showParentGate, setShowParentGate] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0, stage: '' });
  const [isChoiceLoading, setIsChoiceLoading] = useState(false);

  // Race condition protection
  const choiceProcessingLock = useRef(false);

  // Refs to avoid stale closures in callbacks
  const isAutoPlayingRef = useRef(isAutoPlaying);
  const storyRef = useRef(story);

  // Keep refs in sync with state
  useEffect(() => { isAutoPlayingRef.current = isAutoPlaying; }, [isAutoPlaying]);
  useEffect(() => { storyRef.current = story; }, [story]);

  // Loading state for story hydration from IndexedDB
  const [isHydrating, setIsHydrating] = useState(false);

  // Utility: Strip heavy assets (imageUrl, audioData) from story for localStorage
  const stripStoryAssets = (storyToStrip: Story): Story => ({
    ...storyToStrip,
    pages: storyToStrip.pages.map(page => ({
      ...page,
      imageUrl: undefined,
      audioData: undefined
    }))
  });

  // Utility: Strip assets from all stories in a profile's library
  const stripProfileAssets = (profile: ChildProfile): ChildProfile => ({
    ...profile,
    library: profile.library.map(stripStoryAssets)
  });

  useEffect(() => {
    try {
      // Strip heavy assets before saving to localStorage
      const strippedProfiles = profiles.map(stripProfileAssets);
      localStorage.setItem('bandooq_profiles', JSON.stringify(strippedProfiles));
    } catch (e) {
      console.warn("Storage quota exceeded");
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem('bandooq_parent', JSON.stringify(parentConfig));
    } catch { }
  }, [parentConfig]);

  useEffect(() => {
    if (!story && !isGenerating && currentProfile) {
      suggestStoryTopics().then(setSuggestions).catch(() => { });
    }
  }, [story, isGenerating, !!currentProfile]);

  useEffect(() => {
    if (story && story.pages) {
      const maxIdx = Math.max(0, story.pages.length - 1);
      if (currentPage < 0) {
        setCurrentPage(0);
      } else if (currentPage > maxIdx) {
        setCurrentPage(maxIdx);
      }
    }
  }, [story?.id, story?.pages?.length, currentPage]);

  const updateProfileLibrary = useCallback((updatedStory: Story) => {
    // Persist page assets to IndexedDB (fire-and-forget)
    updatedStory.pages.forEach((page, index) => {
      if (page.imageUrl || page.audioData) {
        storePageAssets(updatedStory.id, index, page.imageUrl, page.audioData);
      }
    });

    setProfiles(prev => {
      const profile = prev.find(p => p.id === currentProfile?.id);
      if (!profile) return prev;

      const existingIdx = profile.library.findIndex(s => s.id === updatedStory.id);
      const newLib = existingIdx >= 0
        ? profile.library.map((s, i) => i === existingIdx ? updatedStory : s)
        : [updatedStory, ...profile.library].slice(0, 15);

      const updatedProfile = { ...profile, library: newLib };
      if (currentProfile?.id === profile.id) {
        setCurrentProfile(updatedProfile);
      }
      return prev.map(p => p.id === profile.id ? updatedProfile : p);
    });
  }, [currentProfile?.id]);

  const closeStory = () => {
    setStory(null);
    setCurrentPage(0);
    setTopic('');
  };

  // Load a story from library and hydrate assets from IndexedDB
  const loadStoryFromLibrary = async (libraryStory: Story) => {
    setShowLibrary(false);
    setCurrentPage(0);
    setIsAutoPlaying(true);

    // Set story immediately (placeholders will show for images/audio)
    setStory(libraryStory);
    setIsHydrating(true);

    try {
      // Hydrate assets from IndexedDB
      const assets = await hydrateStoryAssets(libraryStory.id, libraryStory.pages.length);

      // Merge hydrated assets back into the story
      setStory(prev => {
        if (!prev || prev.id !== libraryStory.id) return prev;
        const hydratedPages = prev.pages.map((page, i) => ({
          ...page,
          imageUrl: page.imageUrl || assets[i]?.imageUrl,
          audioData: page.audioData || assets[i]?.audioData
        }));
        return { ...prev, pages: hydratedPages };
      });
    } catch (e) {
      console.warn('Failed to hydrate story assets:', e);
    } finally {
      setIsHydrating(false);
    }
  };

  const startMagic = async () => {
    if (!topic.trim() || !currentProfile) return;
    setIsGenerating(true);
    setStory(null);
    setCurrentPage(0);
    setIsAutoPlaying(true);
    setGenProgress({ current: 0, total: 1, stage: 'جاري تأليف أحداث القصة...' });

    try {
      const workingStory = await generateStoryStructure(topic, pageCount);
      setStory(workingStory);
      updateProfileLibrary(workingStory);

      const totalSteps = workingStory.pages.length * 2;
      let completedSteps = 0;
      setGenProgress({ current: 0, total: totalSteps, stage: 'بندوق يبدأ الرسم والتسجيل الصوتي...' });
      setIsGenerating(false);

      workingStory.pages.forEach(async (page, index) => {
        generateIllustration(workingStory, index).then(url => {
          setStory(prev => {
            if (!prev || prev.id !== workingStory.id) return prev;
            const newPages = [...prev.pages];
            newPages[index] = { ...newPages[index], imageUrl: url };
            const updated = { ...prev, pages: newPages };
            completedSteps++;
            setGenProgress(p => ({ ...p, current: completedSteps }));
            updateProfileLibrary(updated);
            return updated;
          });
        }).catch(() => {
          completedSteps++;
          setGenProgress(p => ({ ...p, current: completedSteps }));
        });

        generateSpeech(page.text_ar).then(audio => {
          setStory(prev => {
            if (!prev || prev.id !== workingStory.id) return prev;
            const newPages = [...prev.pages];
            newPages[index] = { ...newPages[index], audioData: audio };
            const updated = { ...prev, pages: newPages };
            completedSteps++;
            setGenProgress(p => ({ ...p, current: completedSteps }));
            updateProfileLibrary(updated);
            return updated;
          });
        }).catch(() => {
          completedSteps++;
          setGenProgress(p => ({ ...p, current: completedSteps }));
        });
      });
    } catch (err) {
      setIsGenerating(false);
      alert("عذراً يا بطل، حدث خطأ في الخيال! حاول مرة أخرى.");
    }
  };

  const handleChoiceSelected = async (choice: PageChoice) => {
    if (!story || isChoiceLoading || choiceProcessingLock.current) return;
    const nextPageIndex = currentPage + 1;
    if (nextPageIndex >= story.pages.length) return;

    choiceProcessingLock.current = true;
    setIsChoiceLoading(true);
    try {
      setStory(prev => {
        if (!prev) return prev;
        const newPages = [...prev.pages];
        newPages[currentPage] = { ...newPages[currentPage], chosenChoiceId: choice.id };
        const updated = { ...prev, pages: newPages };
        updateProfileLibrary(updated);
        return updated;
      });

      const nextContent = await generateNextPageFromChoice(story, currentPage, choice.text_ar);

      if (!nextContent.text_ar || !nextContent.scene_prompt_en) {
        throw new Error("Partial AI response received");
      }

      setStory(prev => {
        if (!prev) return prev;
        const newPages = [...prev.pages];

        newPages[nextPageIndex] = {
          ...newPages[nextPageIndex],
          text_ar: nextContent.text_ar || newPages[nextPageIndex].text_ar,
          scene_prompt_en: nextContent.scene_prompt_en || newPages[nextPageIndex].scene_prompt_en,
          choices: nextContent.choices || newPages[nextPageIndex].choices,
          imageUrl: undefined,
          audioData: undefined
        };

        const updated = { ...prev, pages: newPages };
        updateProfileLibrary(updated);

        generateIllustration(updated, nextPageIndex).then(url => {
          setStory(s => {
            if (!s || s.id !== updated.id) return s;
            const pages = [...s.pages];
            pages[nextPageIndex] = { ...pages[nextPageIndex], imageUrl: url };
            const up = { ...s, pages };
            updateProfileLibrary(up);
            return up;
          });
        });

        const textForAudio = newPages[nextPageIndex].text_ar;
        if (textForAudio && typeof textForAudio === 'string' && textForAudio.trim()) {
          generateSpeech(textForAudio).then(audio => {
            setStory(s => {
              if (!s || s.id !== updated.id) return s;
              const pages = [...s.pages];
              pages[nextPageIndex] = { ...pages[nextPageIndex], audioData: audio };
              const up = { ...s, pages };
              updateProfileLibrary(up);
              return up;
            });
          });
        }

        return updated;
      });
    } catch (err) {
      console.error("Choice handling error:", err);
    } finally {
      setIsChoiceLoading(false);
      choiceProcessingLock.current = false;
    }
  };

  const nextBtn = () => {
    setCurrentPage(prev => {
      const max = (story?.pages?.length || 1) - 1;
      return Math.min(prev + 1, max);
    });
  };

  const prevBtn = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleProfileSelect = (p: ChildProfile) => {
    setCurrentProfile(p);
    closeStory();
  };

  const storyPages = story?.pages || [];
  const currentPageObj = storyPages[currentPage];
  const hasPendingChoices = currentPageObj?.choices && currentPageObj.choices.length > 0 && !currentPageObj.chosenChoiceId;
  const isLastPage = currentPage === (storyPages.length - 1);

  return (
    <div className="min-h-screen pb-32 px-4 pt-12 md:pt-20">
      {showParentGate && (
        <ParentGate
          parentConfig={parentConfig}
          onConfigUpdate={setParentConfig}
          onSuccess={() => { setShowParentGate(false); setShowProfileManager(true); }}
          onCancel={() => setShowParentGate(false)}
        />
      )}

      {showProfileManager && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-4xl font-black text-indigo-900 mb-10">ملف طفل جديد</h2>
          <div className="space-y-6 w-full max-w-sm">
            <input
              id="new-profile-name"
              autoComplete="off"
              className="w-full p-6 rounded-2xl bg-slate-100 border-4 border-slate-200 text-2xl font-bold text-center"
              placeholder="اسم البطل"
            />
            <div className="flex justify-center gap-4 py-4 flex-wrap">
              {['🤖', '🦁', '🦉', '🚀', '🌈', '🦄'].map(a => (
                <button
                  key={a}
                  onClick={() => {
                    const nameInput = document.getElementById('new-profile-name') as HTMLInputElement;
                    addNewProfile(nameInput.value, a);
                  }}
                  className="text-5xl p-4 bg-indigo-50 rounded-2xl hover:scale-110 transition-all border-4 border-transparent hover:border-indigo-400"
                >
                  {a}
                </button>
              ))}
            </div>
            <button onClick={() => setShowProfileManager(false)} className="text-slate-400 font-bold underline">إلغاء</button>
          </div>
        </div>
      )}

      {!currentProfile ? (
        <ProfileSelector
          profiles={profiles}
          onSelect={handleProfileSelect}
          onManage={() => setShowParentGate(true)}
        />
      ) : (
        <>
          <div className="fixed top-6 left-6 right-6 flex justify-between items-center z-40">
            <button onClick={() => setCurrentProfile(null)} className="flex items-center gap-3 bg-white p-2 pr-6 rounded-full shadow-lg border-4 border-white hover:scale-105 transition-all">
              <span className="font-black text-slate-800 text-xl">{currentProfile.name}</span>
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-3xl">{currentProfile.avatar}</div>
            </button>
            <button onClick={() => setShowLibrary(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-full shadow-lg border-4 border-white font-black hover:scale-105 transition-all">📚 قصصي ({currentProfile.library?.length || 0})</button>
          </div>

          <header className="text-center mb-16">
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-indigo-800 mb-6 drop-shadow-xl select-none">حكاياتي ✨</h1>
          </header>

          <main className="max-w-6xl mx-auto relative min-h-[400px]">
            {isGenerating && (
              <div className="flex flex-col items-center justify-center space-y-8 bg-white/80 backdrop-blur-sm p-20 rounded-[4rem] shadow-2xl border-8 border-white">
                <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-4xl font-black text-indigo-900 mb-2">{genProgress.stage}</p>
                  <p className="text-xl text-indigo-400 font-bold">بندوق يبذل قصارى جهده لجعلها مميزة...</p>
                </div>
              </div>
            )}

            {!isGenerating && !story && (
              <div className="max-w-3xl mx-auto bg-white rounded-[4rem] shadow-2xl p-10 md:p-16 border-8 border-white space-y-12">
                <div className="space-y-6">
                  <label className="block text-3xl font-black text-slate-800 text-center">عن ماذا تود أن تكون الحكاية اليوم؟</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثلاً: مغامرة في أعماق البحار..."
                    className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-4 border-slate-100 text-2xl font-bold text-center focus:outline-none focus:border-indigo-400 transition-all shadow-inner"
                  />
                </div>

                {suggestions.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-4">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setTopic(s)}
                        className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl font-black text-lg hover:bg-indigo-100 transition-colors border-2 border-indigo-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col items-center gap-8 pt-4">
                  <div className="flex items-center gap-6 bg-slate-50 px-8 py-4 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <span className="text-xl font-black text-slate-500">عدد الصفحات:</span>
                    <div className="flex items-center gap-4">
                      {[3, 5, 7].map(n => (
                        <button
                          key={n}
                          onClick={() => setPageCount(n)}
                          className={`w-12 h-12 rounded-xl font-black text-xl transition-all ${pageCount === n ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-100'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startMagic}
                    disabled={!topic.trim()}
                    className="w-full md:w-auto px-20 py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-4xl shadow-[0_15px_0_#4338ca] hover:scale-105 active:translate-y-2 active:shadow-none transition-all disabled:opacity-50"
                  >
                    ابدأ السحر! ✨
                  </button>
                </div>
              </div>
            )}

            {story && !isGenerating && (
              <div className="space-y-12">
                <div className="flex justify-between items-center px-4">
                  <button onClick={closeStory} className="text-slate-400 font-black text-2xl hover:text-rose-500 transition-colors flex items-center gap-2">
                    <span>🏠</span> العودة للبداية
                  </button>
                  <h2 className="text-4xl font-black text-indigo-900 drop-shadow-sm">{story.title}</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className={`px-6 py-3 rounded-2xl font-black transition-all ${isAutoPlaying ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}
                    >
                      {isAutoPlaying ? '⏸️ إيقاف التلقائي' : '▶️ تشغيل تلقائي'}
                    </button>
                  </div>
                </div>

                <StoryPage
                  page={currentPageObj}
                  pageNumber={currentPage + 1}
                  autoStart={isAutoPlaying}
                  onChoiceSelected={handleChoiceSelected}
                  isChoiceLoading={isChoiceLoading}
                  onEnded={() => {
                    // Use refs to get latest values (avoid stale closure)
                    const autoPlay = isAutoPlayingRef.current;
                    const currentStory = storyRef.current;

                    if (!autoPlay || !currentStory) return;

                    // Small delay for smoother page transition
                    setTimeout(() => {
                      setCurrentPage(prev => {
                        const nextPageIndex = prev + 1;

                        // Check if we're at the last page
                        if (nextPageIndex >= currentStory.pages.length) {
                          setIsAutoPlaying(false);
                          return prev;
                        }

                        // Check if next page has pending choices
                        const nextPage = currentStory.pages[nextPageIndex];
                        if (nextPage?.choices?.length && !nextPage.chosenChoiceId) {
                          // Don't auto-advance - user needs to make a choice
                          return prev;
                        }

                        return nextPageIndex;
                      });
                    }, 500);
                  }}
                />

                <div className="flex justify-between items-center max-w-5xl mx-auto w-full px-8">
                  <button
                    disabled={currentPage === 0}
                    onClick={prevBtn}
                    className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-xl border-4 border-white ring-4 ring-indigo-50 disabled:opacity-30 hover:scale-110 active:scale-90 transition-all"
                  >
                    ⬅️
                  </button>
                  <div className="flex gap-4">
                    {storyPages.map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-full transition-all ${i === currentPage ? 'w-12 bg-indigo-600' : 'bg-indigo-100'}`}></div>
                    ))}
                  </div>
                  <button
                    disabled={isLastPage || hasPendingChoices}
                    onClick={nextBtn}
                    className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-xl border-4 border-white ring-4 ring-indigo-50 disabled:opacity-30 hover:scale-110 active:scale-90 transition-all"
                  >
                    ➡️
                  </button>
                </div>
              </div>
            )}
          </main>

          <AssistantChat />

          {showLibrary && (
            <LibraryView
              stories={currentProfile.library || []}
              onSelect={loadStoryFromLibrary}
              onClose={() => setShowLibrary(false)}
            />
          )}
        </>
      )}
    </div>
  );

  function addNewProfile(name: string, avatar: string) {
    const newProfile: ChildProfile = {
      id: Date.now().toString(),
      name: name || 'مستكشف جديد',
      avatar,
      library: []
    };
    setProfiles(prev => [...prev, newProfile]);
    setShowProfileManager(false);
  }
};

export default App;
