import emojiData from 'emoji-datasource-apple/emoji.json';

interface EmojiInfo {
  unified: string;
  short_name: string;
  image: string;
}

interface EmojiData {
  unified: string;
  short_names: string[];
}

export class EmojiService {
  private static instance: EmojiService;
  private emojiMap: Map<string, EmojiInfo>;

  private constructor() {
    this.emojiMap = new Map();
  }

  static getInstance(): EmojiService {
    if (!EmojiService.instance) {
      EmojiService.instance = new EmojiService();
    }
    return EmojiService.instance;
  }

  async initializeEmojiMap(): Promise<void> {
    if (this.emojiMap.size > 0) return;
    
    try {
      const response = await fetch('/node_modules/emoji-datasource-apple/emoji.json');
      const emojiData = await response.json() as EmojiData[];
      
      emojiData.forEach((emoji) => {
        emoji.short_names?.forEach((shortName) => {
          this.emojiMap.set(shortName, {
            unified: emoji.unified,
            short_name: shortName,
            image: `/node_modules/emoji-datasource-apple/img/apple/64/${emoji.unified}.png`
          });
        });
      });
    } catch (error) {
      console.error('Failed to load emoji data:', error);
    }
  }

  convertShortcodeToEmoji(shortcode: string): string {
    const cleanShortcode = shortcode.replace(/:/g, '');
    const emojiInfo = this.emojiMap.get(cleanShortcode);
    
    if (emojiInfo) {
      return String.fromCodePoint(...emojiInfo.unified.split('-').map(hex => parseInt(hex, 16)));
    }
    
    return `:${cleanShortcode}:`;
  }

  getEmojiImage(shortcode: string): string | null {
    const cleanShortcode = shortcode.replace(/:/g, '');
    const emojiInfo = this.emojiMap.get(cleanShortcode);
    return emojiInfo ? emojiInfo.image : null;
  }

  convertTextWithEmoji(text: string): string {
    return text.replace(/:([\w+-]+):/g, (match, shortcode) => {
      return this.convertShortcodeToEmoji(shortcode);
    });
  }
} 