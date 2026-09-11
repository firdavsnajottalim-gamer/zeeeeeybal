export type MessageType = 'chat' | 'code' | 'image_prompt' | 'generated_image' | 'image_gen';

export interface CodeBlock {
  language: string;
  code: string;
  title?: string;
}

export interface ImagePromptDetails {
  mainPrompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  stylePreset?: string;
  cameraSettings?: string;
  tags?: string[];
  parameters?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  type: MessageType;
  codeBlocks?: CodeBlock[];
  imagePromptDetails?: ImagePromptDetails;
  imageUrl?: string;
  thinkingSteps?: string[];
  isThinking?: boolean;
  isStreaming?: boolean;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  category: 'all' | 'code' | 'image_prompt' | 'image_gen' | 'general';
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  isIncognito?: boolean;
}

export interface SavedItem {
  id: string;
  userId: string;
  type: 'code' | 'prompt' | 'image';
  title: string;
  content: string;
  language?: string;
  imageUrl?: string;
  tags?: string[];
  createdAt: number;
}

export interface UserStats {
  totalMessages: number;
  totalCodes: number;
  totalPrompts: number;
  totalImages: number;
}

export interface UserSettings {
  streamSpeed: 'slow' | 'medium' | 'fast';
  neonIntensity: 'high' | 'subtle';
  defaultMode: 'all' | 'code' | 'image_prompt';
  soundEffects: boolean;
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: number;
  stats: UserStats;
  settings: UserSettings;
}
