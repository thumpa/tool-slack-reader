import { DataLoader } from './data-loader';

interface Channel {
  id: string;
  name: string;
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
}

export class ChannelService {
  private static instance: ChannelService;
  private channelCache: Map<string, Channel[]> = new Map();

  private constructor() {}

  public static getInstance(): ChannelService {
    if (!ChannelService.instance) {
      ChannelService.instance = new ChannelService();
    }
    return ChannelService.instance;
  }

  public async loadChannels(workspace: string): Promise<Channel[]> {
    const cacheKey = workspace;
    
    if (this.channelCache.has(cacheKey)) {
      console.log('[ChannelService] Returning cached channels for workspace:', workspace, this.channelCache.get(cacheKey));
      return this.channelCache.get(cacheKey)!;
    }

    try {
      console.log('[ChannelService] Loading channels from:', `/data/${workspace}/channels.json`);
      const response = await fetch(`/data/${workspace}/channels.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const channels = await response.json();
      console.log('[ChannelService] Loaded channels:', channels);
      this.channelCache.set(cacheKey, channels);
      return channels;
    } catch (error) {
      console.error('[ChannelService] Error loading channels:', error);
      throw error;
    }
  }

  public async getChannel(workspace: string, channelId: string): Promise<Channel | null> {
    console.log('[ChannelService] Getting channel:', channelId, 'from workspace:', workspace);
    const channels = await this.loadChannels(workspace);
    console.log('[ChannelService] All channels:', channels);
    
    // Try exact match first
    let channel = channels.find(channel => channel.id === channelId);
    
    // If no exact match, try case-insensitive match
    if (!channel) {
      channel = channels.find(channel => 
        channel.id.toLowerCase() === channelId.toLowerCase() ||
        channel.name.toLowerCase() === channelId.toLowerCase()
      );
    }
    
    console.log('[ChannelService] Found channel:', channel);
    return channel || null;
  }

  public clearCache(): void {
    this.channelCache.clear();
  }
} 