import { CodeBlock, ImagePromptDetails } from '../types';

export function parseContent(text: string): {
  cleanText: string;
  codeBlocks: CodeBlock[];
  imagePromptDetails?: ImagePromptDetails;
} {
  const codeBlocks: CodeBlock[] = [];
  const codeRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;

  let match;
  while ((match = codeRegex.exec(text)) !== null) {
    const rawLang = match[1]?.trim() || 'text';
    const code = match[2];
    codeBlocks.push({
      language: rawLang.toLowerCase(),
      code: code,
      title: `${rawLang.toUpperCase()} KODI`,
    });
  }

  // Check if text looks like an image prompt description (Midjourney, Flux, Imagen)
  let imagePromptDetails: ImagePromptDetails | undefined;

  const promptPatterns = [
    /(?:prompt|tasvir|image prompt|midjourney|flux):\s*["'«]?([^"'\n\r«»]{20,})["'»]?/i,
    /(?:\/imagine prompt:\s*)([^\n\r]{20,})/i,
    /(?:\*\*Prompt:\*\*\s*)([^\n\r]{20,})/i,
  ];

  for (const pattern of promptPatterns) {
    const promptMatch = text.match(pattern);
    if (promptMatch && promptMatch[1]) {
      const main = promptMatch[1].trim();
      
      // Look for aspect ratio
      const arMatch = text.match(/--ar\s+([0-9]+:[0-9]+)/i);
      // Look for negative prompt
      const negMatch = text.match(/(?:negative prompt|keraksiz|exclude):\s*([^\n\r]+)/i);
      
      imagePromptDetails = {
        mainPrompt: main,
        aspectRatio: arMatch ? arMatch[1] : '16:9',
        negativePrompt: negMatch ? negMatch[1].trim() : undefined,
        stylePreset: text.toLowerCase().includes('cyberpunk') ? 'Cyberpunk' : 
                     text.toLowerCase().includes('anime') ? 'Anime' : 
                     text.toLowerCase().includes('fotorealistik') || text.toLowerCase().includes('photorealistic') ? 'Photorealistic' : 'Cinematic 3D',
      };
      break;
    }
  }

  return {
    cleanText: text,
    codeBlocks,
    imagePromptDetails,
  };
}
