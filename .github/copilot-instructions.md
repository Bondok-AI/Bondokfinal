# Copilot Instructions - حكاياتي الذكية (My Smart Tales)

## Project Overview
Arabic interactive children's storybook app using Gemini AI for story generation, image creation, and text-to-speech. Built with React 19 + TypeScript + Vite. The mascot "بندوق" (Bandooq) is an AI robot assistant.

## Architecture

### Core Data Flow
1. User enters topic → `geminiService.generateStoryStructure()` → Story with pages + character + style
2. Pages 2 & 3 have interactive `choices[]` for branching narratives
3. Assets (images/audio) generated async per page and cached in IndexedDB via `storageService`
4. Stories saved to child profiles in localStorage (metadata only; blobs in IndexedDB)

### Key Files
- [App.tsx](../App.tsx) - Main orchestrator: profile management, story state, page navigation
- [types.ts](../types.ts) - Core types: `Story`, `Page`, `PageChoice`, `ChildProfile`, `ParentConfig`
- [services/geminiService.ts](../services/geminiService.ts) - All Gemini API calls with retry logic
- [services/storageService.ts](../services/storageService.ts) - IndexedDB via localforage for asset persistence

### Gemini AI Integration Patterns
```typescript
// All AI calls use withRetry() wrapper for resilience
// Models used:
- gemini-2.0-flash: Story structure, chat, topic suggestions
- gemini-2.5-flash-image: Illustration generation
- gemini-2.5-flash-preview-tts: Arabic speech synthesis
```

## Conventions

### State Management
- No external state library - React useState/useRef with callbacks
- Refs (`storyRef`, `isAutoPlayingRef`) prevent stale closures in async callbacks
- `choiceProcessingLock.current` prevents race conditions on choice selection

### Storage Split
- **localStorage**: Profiles array with stripped stories (no imageUrl/audioData)
- **IndexedDB**: Binary assets keyed as `story:{id}:page:{index}:image|audio`
- Hydration pattern: Load story skeleton, then `hydrateStoryAssets()` fills blobs

### Arabic UI Patterns
- All user-facing text in Arabic (العربية)
- RTL layout implicit via content
- Child-friendly language: "يا بطل" (hero), "سحري" (magical)
- Error messages are encouraging, not technical

### Component Patterns
- [StoryPage.tsx](../components/StoryPage.tsx) - Audio playback with Web Audio API + browser fallback
- [AssistantChat.tsx](../components/AssistantChat.tsx) - Bandooq chat with conversation history
- [ParentGate.tsx](../components/ParentGate.tsx) - PIN protection using SHA-256 hashing

## Development

```bash
# Install and run
npm install
echo "VITE_GEMINI_API_KEY=your-key" > .env.local
npm run dev  # Runs on port 3000
```

### API Key Requirement
The app requires `VITE_GEMINI_API_KEY` in `.env.local`. Without it, all AI features fail with a descriptive error.

## Important Patterns

### Interactive Story Choices
Pages at index 1 and 2 include `choices[]` array. When selected:
1. Mark `chosenChoiceId` on current page
2. Call `generateNextPageFromChoice()` to rewrite next page based on choice
3. Regenerate image/audio for the updated page

### Asset Generation Flow
Assets generate in parallel after story structure is ready. Track progress via `genProgress` state. Failed generations silently degrade - story remains usable without images/audio.

### Profile Library
Each profile stores up to 15 stories. On save, `stripStoryAssets()` removes blobs before localStorage write. Full assets retrieved on load via `hydrateStoryAssets()`.
