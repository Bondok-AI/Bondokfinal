
export interface PageChoice {
  id: string;
  text_ar: string;
}

export interface Page {
  text_ar: string;
  scene_prompt_en: string;
  imageUrl?: string;
  audioData?: string;
  choices?: PageChoice[];
  chosenChoiceId?: string;
}

export interface Character {
  name_ar: string;
  name_en: string;
  visual_sheet_en: string;
  personality_ar: string;
  catchphrase_ar?: string;
}

export interface StoryStyle {
  art_style_en: string;
  negative_prompt_en: string;
}

export interface Story {
  id: string;
  title: string;
  age_range: string;
  character: Character;
  style: StoryStyle;
  pages: Page[];
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  library: Story[];
}

export interface ParentConfig {
  pinHash: string;       // SHA-256 hash of the PIN
  isSetup: boolean;      // Whether PIN has been set up
  failedAttempts: number; // Count of consecutive failed attempts
  lockUntil: number;     // Timestamp when lockout expires (0 = not locked)
}
