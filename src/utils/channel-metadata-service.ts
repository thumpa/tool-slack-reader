import { DataLoader } from './data-loader';

interface ChannelMetadata {
  messageCount: number;
  lastCounted: string;
}

interface ChannelMetadataStore {
  channels: {
    [channelName: string]: ChannelMetadata;
  };
}

export class ChannelMetadataService {
  private static instance: ChannelMetadataService;
  private metadata: Map<string, ChannelMetadataStore> = new Map();
  private dataLoader: DataLoader;
  private isLoading = new Set<string>();
  private lastError: Error | null = null;
  private hasLoadedMetadata = new Set<string>();
  private initializationPromises: Map<string, Promise<void>> = new Map();

  private constructor() {
    this.dataLoader = DataLoader.getInstance();
  }

  public static getInstance(): ChannelMetadataService {
    if (!ChannelMetadataService.instance) {
      ChannelMetadataService.instance = new ChannelMetadataService();
    }
    return ChannelMetadataService.instance;
  }

  private async loadMetadata(workspace: string): Promise<void> {
    if (this.isLoading.has(workspace)) {
      console.log(`Already loading metadata for workspace ${workspace}, waiting for completion...`);
      return;
    }

    if (this.hasLoadedMetadata.has(workspace)) {
      console.log(`Using cached metadata for workspace ${workspace}`);
      return;
    }

    this.isLoading.add(workspace);
    try {
      console.log(`Loading metadata for workspace ${workspace}...`);
      const response = await fetch(`/api/metadata?workspace=${workspace}`);
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `HTTP error! status: ${response.status}`);
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 100)}`);
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const data = await response.json();
      if (!data || typeof data !== 'object' || !data.channels) {
        throw new Error('Invalid metadata format received');
      }
      
      this.metadata.set(workspace, data);
      this.hasLoadedMetadata.add(workspace);
      this.lastError = null;
      console.log(`Metadata loaded successfully for workspace ${workspace}:`, Object.keys(data.channels).length, 'channels');
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Error loading metadata for workspace ${workspace}:`, this.lastError);
      this.metadata.set(workspace, { channels: {} });
      throw this.lastError;
    } finally {
      this.isLoading.delete(workspace);
    }
  }

  private async saveMetadata(workspace: string): Promise<void> {
    try {
      console.log(`Saving metadata for workspace ${workspace}...`);
      const metadata = this.metadata.get(workspace) || { channels: {} };
      
      const response = await fetch(`/api/save-metadata?workspace=${workspace}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `HTTP error! status: ${response.status}`);
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 100)}`);
        }
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Save operation failed');
      }
      
      this.lastError = null;
      console.log(`Metadata saved successfully for workspace ${workspace}`);
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Error saving metadata for workspace ${workspace}:`, this.lastError);
      throw this.lastError;
    }
  }

  public getLastError(): Error | null {
    return this.lastError;
  }

  private async countMessagesInChannel(workspace: string, channelName: string): Promise<number> {
    try {
      console.log(`Counting messages for channel ${channelName} in workspace ${workspace}`);
      const files = await this.dataLoader.listChannelFiles(workspace, channelName);
      let totalCount = 0;

      for (const file of files) {
        if (file.endsWith('.json') && file !== 'channel-metadata.json') {
          try {
            const response = await fetch(`/api/channels/${channelName}/${file}?workspace=${workspace}`);
            if (!response.ok) {
              console.warn(`Failed to load file ${file} for channel ${channelName}: ${response.statusText}`);
              continue;
            }
            const messages = await response.json();
            if (Array.isArray(messages)) {
              totalCount += messages.length;
            }
          } catch (error) {
            console.warn(`Error processing file ${file} for channel ${channelName}:`, error);
            continue;
          }
        }
      }

      console.log(`Found ${totalCount} messages in channel ${channelName} (workspace: ${workspace})`);
      return totalCount;
    } catch (error) {
      const e = error instanceof Error ? error : new Error(String(error));
      console.error(`Error counting messages in channel ${channelName} (workspace: ${workspace}):`, e);
      throw e;
    }
  }

  public async getMessageCount(workspace: string, channelName: string): Promise<number> {
    try {
      // Initialize metadata loading for this workspace if not already done
      if (!this.initializationPromises.has(workspace)) {
        this.initializationPromises.set(workspace, this.loadMetadata(workspace));
      }

      // Wait for initial metadata load if it's still in progress
      await this.initializationPromises.get(workspace);

      // If metadata hasn't been loaded yet (e.g. if initial load failed), try again
      if (!this.hasLoadedMetadata.has(workspace)) {
        await this.loadMetadata(workspace);
      }

      // Get workspace metadata
      const workspaceMetadata = this.metadata.get(workspace);
      if (!workspaceMetadata) {
        throw new Error(`Workspace ${workspace} not found in metadata`);
      }

      // Normalize channel name to match metadata format
      const normalizedChannelName = channelName.toLowerCase();

      // Check if we have cached data
      if (workspaceMetadata.channels[normalizedChannelName]) {
        const cachedData = workspaceMetadata.channels[normalizedChannelName];
        console.log(`Using cached count for ${normalizedChannelName} in workspace ${workspace}: ${cachedData.messageCount} (last counted: ${cachedData.lastCounted})`);
        return cachedData.messageCount;
      }

      console.log(`No cached data for ${normalizedChannelName} in workspace ${workspace}, counting messages...`);
      const count = await this.countMessagesInChannel(workspace, normalizedChannelName);
      workspaceMetadata.channels[normalizedChannelName] = {
        messageCount: count,
        lastCounted: new Date().toISOString()
      };
      
      this.metadata.set(workspace, workspaceMetadata);
      await this.saveMetadata(workspace);
      return count;
    } catch (error) {
      const e = error instanceof Error ? error : new Error(String(error));
      console.error(`Error getting message count for channel ${channelName} in workspace ${workspace}:`, e);
      throw e;
    }
  }

  public async clearMetadata(workspace: string, channelName?: string): Promise<void> {
    try {
      const workspaceMetadata = this.metadata.get(workspace);
      if (!workspaceMetadata) return;

      if (channelName) {
        console.log(`Clearing metadata for channel ${channelName} in workspace ${workspace}`);
        delete workspaceMetadata.channels[channelName];
      } else {
        console.log(`Clearing all metadata for workspace ${workspace}`);
        this.metadata.delete(workspace);
        this.hasLoadedMetadata.delete(workspace);
        this.initializationPromises.delete(workspace);
      }

      if (channelName) {
        await this.saveMetadata(workspace);
      }
    } catch (error) {
      const e = error instanceof Error ? error : new Error(String(error));
      console.error(`Error clearing metadata for workspace ${workspace}:`, e);
      throw e;
    }
  }
} 