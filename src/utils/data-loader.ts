export interface Message {
  client_msg_id?: string;
  type: string;
  user: string;
  text: string;
  ts: string;
  team?: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: any[];
  files?: any[];
}

export interface ChannelListItem {
  id: string;
  name: string;
}

export class DataLoader {
  private static instance: DataLoader;
  private channelCache: Map<string, ChannelListItem[]> = new Map();
  private messageCache: Map<string, Message[]> = new Map();
  private fileListCache: Map<string, string[]> = new Map();

  private constructor() {}

  public static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  private getCacheKey(workspace: string, channelId?: string): string {
    return channelId ? `${workspace}:${channelId}` : workspace;
  }

  public async loadChannels(workspace: string): Promise<ChannelListItem[]> {
    const cacheKey = this.getCacheKey(workspace);
    if (this.channelCache.has(cacheKey)) {
      return this.channelCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`/api/channels?workspace=${workspace}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const channels = await response.json();
      this.channelCache.set(cacheKey, channels);
      return channels;
    } catch (error) {
      console.error('Error loading channels:', error);
      throw error;
    }
  }

  public async loadChannelMessages(workspace: string, channelId: string): Promise<Message[]> {
    const cacheKey = this.getCacheKey(workspace, channelId);
    if (this.messageCache.has(cacheKey)) {
      return this.messageCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`/api/messages?workspace=${workspace}&channel=${channelId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const messages = await response.json();
      this.messageCache.set(cacheKey, messages);
      return messages;
    } catch (error) {
      console.error('Error loading messages:', error);
      throw error;
    }
  }

  public async listChannelFiles(workspace: string, channelId: string): Promise<string[]> {
    const cacheKey = this.getCacheKey(workspace, channelId);
    if (this.fileListCache.has(cacheKey)) {
      return this.fileListCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`/api/channels/${channelId}/files?workspace=${workspace}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const files = await response.json();
      this.fileListCache.set(cacheKey, files);
      return files;
    } catch (error) {
      console.error('Error listing channel files:', error);
      throw error;
    }
  }

  public clearCache(): void {
    this.channelCache.clear();
    this.messageCache.clear();
    this.fileListCache.clear();
  }
} 