
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Story, Page, PageChoice } from "../types";
import { getTTSCache, setTTSCache } from "./storageService";

const CACHE_PREFIX = 'bandooq_voice_';

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey) {
    throw new Error("Gemini API Key is missing! Please set VITE_GEMINI_API_KEY in your .env.local file.");
  }
  return new GoogleGenAI({ apiKey });
};

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

export const speakWithBrowser = (text: string) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  utterance.pitch = 1.1;
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
};

const getCacheKey = (text: string): string => {
  try {
    return CACHE_PREFIX + btoa(encodeURIComponent(text.substring(0, 100)));
  } catch {
    return CACHE_PREFIX + text.length;
  }
};

export const suggestStoryTopics = async (): Promise<string[]> => {
  return withRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: "اقترح 4 مواضيع مشوقة لقصص أطفال أصلية وفريدة بالعربية. لا تستخدم قصصاً معروفة. مثال: مغامرة سلحفاة تكتشف غابة من الجزر الطائر.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["suggestions"]
        }
      }
    });
    return JSON.parse(response.text || '{}').suggestions || [];
  }).catch(() => ["تنين يحب الحلوى", "مغامرة في الفضاء", "الروبوت الضاحك"]);
};

export const generateStoryStructure = async (prompt: string, pageCount: number = 5): Promise<Story> => {
  const systemInstruction = `You are a world-class children's storybook author and illustrator. 
  Task: Author an original Arabic story for children (5-10 years old). 
  Structure: 
  - Intro: Establish the unique world and character.
  - Problem: A gentle but engaging challenge arises.
  - Attempts: The character tries to solve it (with high stakes/magic).
  - Resolution: A warm, happy ending with a soft emotional lesson.
  
  Strict Rules:
  - text_ar: MUST be between 60-120 Arabic words per page.
  - Character Consistency: Create a unique 'visual_sheet_en' (species, age, colors, clothing).
  - Style Consistency: Define a stable high-quality 3D cartoon storybook art style.
  - Interactive Choices: For pages at index 1 and 2 (page 2 and 3), provide exactly 2 kid-safe interactive "choices" in Arabic that let the reader decide what the character does next.
  - No copyrighted characters. Total originality only.
  - Return ONLY valid JSON.`;

  const performGeneration = async (model: string) => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: `Create a magical story about "${prompt}" with ${pageCount} pages. Pages 2 and 3 must have interactive choices. Follow the schema exactly.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            age_range: { type: Type.STRING },
            character: {
              type: Type.OBJECT,
              properties: {
                name_ar: { type: Type.STRING },
                name_en: { type: Type.STRING },
                visual_sheet_en: { type: Type.STRING },
                personality_ar: { type: Type.STRING }
              },
              required: ["name_ar", "name_en", "visual_sheet_en", "personality_ar"]
            },
            style: {
              type: Type.OBJECT,
              properties: {
                art_style_en: { type: Type.STRING },
                negative_prompt_en: { type: Type.STRING }
              },
              required: ["art_style_en", "negative_prompt_en"]
            },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text_ar: { type: Type.STRING },
                  scene_prompt_en: { type: Type.STRING },
                  choices: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text_ar: { type: Type.STRING }
                      },
                      required: ["id", "text_ar"]
                    }
                  }
                },
                required: ["text_ar", "scene_prompt_en"]
              }
            }
          },
          required: ["title", "age_range", "character", "style", "pages"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    const data = JSON.parse(text);

    // Hardening: Ensure choices exist on pages 2 and 3 (index 1 and 2)
    // Page index 1 -> Page 2; Page index 2 -> Page 3
    if (data.pages[1] && (!data.pages[1].choices || data.pages[1].choices.length !== 2)) {
      data.pages[1].choices = [
        { id: 'p2_c1', text_ar: 'يكمل المغامرة بشجاعة' },
        { id: 'p2_c2', text_ar: 'يبحث عن حل سحري ومبتكر' }
      ];
    }
    if (data.pages[2] && (!data.pages[2].choices || data.pages[2].choices.length !== 2)) {
      data.pages[2].choices = [
        { id: 'p3_c1', text_ar: 'يكمل المغامرة بشجاعة' },
        { id: 'p3_c2', text_ar: 'يبحث عن حل سحري ومبتكر' }
      ];
    }

    return { ...data, id: Date.now().toString(), createdAt: Date.now() };
  };

  try {
    return await withRetry(() => performGeneration('gemini-2.0-flash'));
  } catch (err) {
    return await withRetry(() => performGeneration('gemini-2.0-flash'));
  }
};

export const generateNextPageFromChoice = async (story: Story, pageIndex: number, chosenChoiceText: string): Promise<Partial<Page>> => {
  return withRetry(async () => {
    const ai = getAiClient();
    const previousPagesText = story.pages.slice(0, pageIndex + 1).map(p => p.text_ar).join("\n\n");

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Continuing the story "${story.title}". 
      Main character: ${story.character.name_en} (${story.character.visual_sheet_en}).
      Story so far: ${previousPagesText}
      The child chose: "${chosenChoiceText}".
      Generate the NEXT page text (text_ar: 60-120 Arabic words) and a matching image prompt (scene_prompt_en).
      If this is the next page after index 1 (meaning we are generating page index 2), also provide 2 new interactive choices for this new page.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text_ar: { type: Type.STRING },
            scene_prompt_en: { type: Type.STRING },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text_ar: { type: Type.STRING }
                },
                required: ["id", "text_ar"]
              }
            }
          },
          required: ["text_ar", "scene_prompt_en"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  });
};

export const generateIllustration = async (story: Story, pageIndex: number): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = getAiClient();
    const page = story.pages[pageIndex];
    const fullPrompt = `${story.style.art_style_en}. Main character (${story.character.name_en}): ${story.character.visual_sheet_en}. Scene: ${page.scene_prompt_en}. ${story.style.negative_prompt_en}. Vibrant colors, cinematic lighting, ultra-detailed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fullPrompt }] }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : undefined;
  });
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const cacheKey = getCacheKey(text);

  // Check IndexedDB cache first
  const cached = await getTTSCache(cacheKey);
  if (cached) return cached;

  return withRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
      }
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      // Cache to IndexedDB (fire-and-forget)
      setTTSCache(cacheKey, audioData);
      return audioData;
    }
    throw new Error("No audio returned");
  }).catch(() => undefined);
};

export const chatWithAssistant = async (message: string, history: any[]) => {
  return withRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction: 'أنت "بندوق"، روبوت ذكي وصديق للأطفال. إجاباتك قصيرة (حد أقصى جملتين)، وبالعربية الفصحى البسيطة والدافئة. وظيفتك الإجابة عن أسئلة تخص القصص أو العلم بأسلوب مشجع.' }
    });
    return response.text;
  }).catch(() => "أنا هنا معك يا بطل! هل نبدأ قصة جديدة؟");
};

export const decodeBase64 = (base64: string): Uint8Array => {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  } catch (e) {
    return new Uint8Array(0);
  }
};

export const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
  try {
    const arrayBuffer = data.buffer.slice(0);
    return await ctx.decodeAudioData(arrayBuffer);
  } catch (e) {
    try {
      const dataInt16 = new Int16Array(data.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      return buffer;
    } catch (innerError) {
      return ctx.createBuffer(1, 1, 24000);
    }
  }
};
