export interface WorkspaceMetadata {
  tool_name: string;
  workspace_name: string;
  date_range: {
    start: string;
    end: string;
  };
  description: string;
  export_date: string;
}

export interface Workspace {
  id: string;
  name: string;
  folder: string;
  description: string;
  export_date: string;
}

export interface WorkspaceStore {
  version: string;
  last_updated: string;
  workspaces: Workspace[];
}

export class WorkspaceService {
  private static instance: WorkspaceService;
  private workspaces: WorkspaceStore | null = null;
  private isLoading = false;
  private hasLoadedWorkspaces = false;
  private lastError: Error | null = null;

  private constructor() {}

  static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  private async loadWorkspaces(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const response = await fetch('/api/workspaces');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data.workspaces || !Array.isArray(data.workspaces)) {
        throw new Error('Invalid workspace data received from server');
      }

      this.workspaces = {
        version: "1.0",
        last_updated: new Date().toISOString(),
        workspaces: data.workspaces
      };

      this.hasLoadedWorkspaces = true;
      this.lastError = null;
      console.log(`Loaded ${data.workspaces.length} workspaces`);

    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error));
      console.error('Error loading workspaces:', this.lastError);
      throw this.lastError;
    } finally {
      this.isLoading = false;
    }
  }

  public async getWorkspaces(): Promise<WorkspaceStore> {
    if (!this.hasLoadedWorkspaces) {
      await this.loadWorkspaces();
    }
    return this.workspaces || { version: "1.0", last_updated: new Date().toISOString(), workspaces: [] };
  }

  public getLastError(): Error | null {
    return this.lastError;
  }
} 