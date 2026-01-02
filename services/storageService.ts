
import localforage from 'localforage';

// Configure localforage to use IndexedDB
const assetStore = localforage.createInstance({
  name: 'bandooq_db',
  storeName: 'assets',
  description: 'Stores story images and audio data'
});

const cacheStore = localforage.createInstance({
  name: 'bandooq_db',
  storeName: 'cache',
  description: 'Stores TTS audio cache'
});

// Asset key generators
export const getImageKey = (storyId: string, pageIndex: number): string => 
  `story:${storyId}:page:${pageIndex}:image`;

export const getAudioKey = (storyId: string, pageIndex: number): string => 
  `story:${storyId}:page:${pageIndex}:audio`;

// Generic JSON storage
export const setJson = async <T>(key: string, value: T): Promise<void> => {
  try {
    await assetStore.setItem(key, value);
  } catch (e) {
    console.warn('IndexedDB setJson failed:', e);
  }
};

export const getJson = async <T>(key: string): Promise<T | null> => {
  try {
    return await assetStore.getItem<T>(key);
  } catch (e) {
    console.warn('IndexedDB getJson failed:', e);
    return null;
  }
};

// Base64 blob storage for images and audio
export const setBlobBase64 = async (key: string, base64: string): Promise<void> => {
  try {
    await assetStore.setItem(key, base64);
  } catch (e) {
    console.warn('IndexedDB setBlobBase64 failed:', e);
  }
};

export const getBlobBase64 = async (key: string): Promise<string | null> => {
  try {
    return await assetStore.getItem<string>(key);
  } catch (e) {
    console.warn('IndexedDB getBlobBase64 failed:', e);
    return null;
  }
};

// TTS Cache (separate store to manage independently)
export const setTTSCache = async (textHash: string, audioData: string): Promise<void> => {
  try {
    await cacheStore.setItem(textHash, audioData);
  } catch (e) {
    console.warn('IndexedDB TTS cache set failed:', e);
  }
};

export const getTTSCache = async (textHash: string): Promise<string | null> => {
  try {
    return await cacheStore.getItem<string>(textHash);
  } catch (e) {
    console.warn('IndexedDB TTS cache get failed:', e);
    return null;
  }
};

// Store page assets for a story
export const storePageAssets = async (
  storyId: string, 
  pageIndex: number, 
  imageUrl?: string, 
  audioData?: string
): Promise<void> => {
  const promises: Promise<void>[] = [];
  
  if (imageUrl) {
    promises.push(setBlobBase64(getImageKey(storyId, pageIndex), imageUrl));
  }
  if (audioData) {
    promises.push(setBlobBase64(getAudioKey(storyId, pageIndex), audioData));
  }
  
  await Promise.all(promises);
};

// Hydrate a single page with assets from IndexedDB
export const hydratePageAssets = async (
  storyId: string, 
  pageIndex: number
): Promise<{ imageUrl?: string; audioData?: string }> => {
  const [imageUrl, audioData] = await Promise.all([
    getBlobBase64(getImageKey(storyId, pageIndex)),
    getBlobBase64(getAudioKey(storyId, pageIndex))
  ]);
  
  return {
    imageUrl: imageUrl || undefined,
    audioData: audioData || undefined
  };
};

// Hydrate all pages for a story
export const hydrateStoryAssets = async (
  storyId: string, 
  pageCount: number
): Promise<Array<{ imageUrl?: string; audioData?: string }>> => {
  const promises = Array.from({ length: pageCount }, (_, i) => 
    hydratePageAssets(storyId, i)
  );
  return Promise.all(promises);
};

// Delete all assets for a story (cleanup)
export const deleteStoryAssets = async (storyId: string, pageCount: number): Promise<void> => {
  const promises: Promise<void>[] = [];
  
  for (let i = 0; i < pageCount; i++) {
    promises.push(
      assetStore.removeItem(getImageKey(storyId, i)),
      assetStore.removeItem(getAudioKey(storyId, i))
    );
  }
  
  await Promise.all(promises);
};
