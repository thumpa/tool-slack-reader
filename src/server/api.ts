import express from 'express';
import { writeFile, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const dataPath = join(process.cwd(), 'public', 'data');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Helper function to get workspace path
function getWorkspacePath(workspace: string): string {
  return path.join(process.cwd(), 'public', 'data', workspace);
}

// Helper function to get metadata path for a workspace
function getMetadataPath(workspace: string): string {
  return path.join(getWorkspacePath(workspace), 'channel-metadata.json');
}

// List available workspaces
router.get('/workspaces', async (req, res) => {
  console.log('GET /workspaces - Request received');
  try {
    // Ensure data directory exists
    if (!existsSync(dataPath)) {
      console.log('Creating data directory:', dataPath);
      mkdirSync(dataPath, { recursive: true });
      return res.json({ workspaces: [] });
    }

    const items = await fs.readdir(dataPath);
    const workspaces = [];

    for (const item of items) {
      const itemPath = path.join(dataPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory() && !item.startsWith('.')) {
        let workspaceInfo = {
          id: item,
          name: item,
          folder: item,
          description: `Slack export for ${item}`,
          export_date: stats.mtime.toISOString().split('T')[0]
        };

        // Try to read workspace.json if it exists
        try {
          const workspaceJsonPath = path.join(itemPath, 'workspace.json');
          if (existsSync(workspaceJsonPath)) {
            const content = await fs.readFile(workspaceJsonPath, 'utf-8');
            const metadata = JSON.parse(content);
            workspaceInfo = { ...workspaceInfo, ...metadata };
          }
        } catch (err) {
          console.warn(`No workspace.json found for ${item}, using defaults`);
        }

        workspaces.push(workspaceInfo);
      }
    }

    console.log(`Found ${workspaces.length} workspaces`);
    res.json({ workspaces });
  } catch (error) {
    console.error('Error listing workspaces:', error);
    res.status(500).json({ error: 'Failed to list workspaces' });
  }
});

// List channels in a workspace
router.get('/channels', async (req, res) => {
  try {
    const workspace = req.query.workspace;
    if (!workspace || typeof workspace !== 'string') {
      return res.status(400).json({ error: 'Workspace parameter is required' });
    }

    const workspacePath = getWorkspacePath(workspace);
    const items = await fs.readdir(workspacePath);
    
    // Filter for directories only
    const channels = [];
    for (const item of items) {
      const itemPath = path.join(workspacePath, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        channels.push({
          id: item,
          name: item
        });
      }
    }

    res.json(channels);
  } catch (error) {
    console.error('Error listing channels:', error);
    res.status(500).json({ error: 'Failed to list channels' });
  }
});

// Get messages for a channel
router.get('/messages', async (req, res) => {
  try {
    const { workspace, channel } = req.query;
    if (!workspace || !channel || typeof workspace !== 'string' || typeof channel !== 'string') {
      return res.status(400).json({ error: 'Workspace and channel parameters are required' });
    }

    const channelPath = path.join(getWorkspacePath(workspace), channel);
    const files = await fs.readdir(channelPath);
    
    // Load and combine all JSON files
    const messagePromises = files
      .filter(file => file.endsWith('.json'))
      .map(async file => {
        const content = await fs.readFile(path.join(channelPath, file), 'utf-8');
        return JSON.parse(content);
      });

    const messageArrays = await Promise.all(messagePromises);
    const allMessages = messageArrays
      .flat()
      .sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

    res.json(allMessages);
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Get metadata for a workspace
router.get('/metadata', async (req, res) => {
  console.log('GET /metadata - Request received');
  try {
    const { workspace } = req.query;
    if (!workspace || typeof workspace !== 'string') {
      return res.status(400).json({ error: 'Workspace parameter is required' });
    }

    const metadataPath = getMetadataPath(workspace);
    console.log('Looking for metadata at:', metadataPath);

    if (!existsSync(metadataPath)) {
      console.log('Metadata file does not exist for workspace, returning empty channels');
      return res.json({ channels: {} });
    }

    const data = await readFile(metadataPath, 'utf-8');
    console.log('Read metadata file successfully');
    const parsed = JSON.parse(data);
    res.json(parsed);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error reading metadata:', error);
    res.status(500).json({ error: 'Failed to read metadata', details: errorMessage });
  }
});

// Save metadata for a workspace
router.post('/save-metadata', async (req, res) => {
  console.log('POST /save-metadata - Request received');
  try {
    const { workspace } = req.query;
    if (!workspace || typeof workspace !== 'string') {
      return res.status(400).json({ error: 'Workspace parameter is required' });
    }

    const metadata = req.body;
    
    // Validate metadata structure
    if (!metadata || typeof metadata !== 'object' || !metadata.channels) {
      console.error('Invalid metadata format received:', metadata);
      return res.status(400).json({ error: 'Invalid metadata format' });
    }

    const workspacePath = getWorkspacePath(workspace);
    const metadataPath = getMetadataPath(workspace);

    // Ensure workspace directory exists
    if (!existsSync(workspacePath)) {
      console.error('Workspace directory does not exist:', workspacePath);
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Validate JSON stringification before writing
    const jsonString = JSON.stringify(metadata, null, 2);
    JSON.parse(jsonString); // Validate that it's valid JSON
    
    console.log('Writing metadata to:', metadataPath);
    await writeFile(metadataPath, jsonString);
    console.log('Metadata saved successfully');
    res.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving metadata:', error);
    res.status(500).json({ error: 'Failed to save metadata', details: errorMessage });
  }
});

// List files in a channel
router.get('/channels/:channelId/files', async (req, res) => {
  console.log(`GET /channels/${req.params.channelId}/files - Request received`);
  try {
    const { workspace } = req.query;
    if (!workspace || typeof workspace !== 'string') {
      return res.status(400).json({ error: 'Workspace parameter is required' });
    }

    const channelPath = path.join(getWorkspacePath(workspace), req.params.channelId);
    if (!existsSync(channelPath)) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const files = await readdir(channelPath);
    console.log(`Found files for channel ${req.params.channelId}:`, files);
    res.json(files);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error reading files for channel ${req.params.channelId}:`, error);
    res.status(500).json({ error: 'Failed to read channel files', details: errorMessage });
  }
});

// Get channel file content
router.get('/channels/:channelId/:filename', async (req, res) => {
  console.log(`GET /channels/${req.params.channelId}/${req.params.filename} - Request received`);
  try {
    const { workspace } = req.query;
    if (!workspace || typeof workspace !== 'string') {
      return res.status(400).json({ error: 'Workspace parameter is required' });
    }

    const filePath = path.join(getWorkspacePath(workspace), req.params.channelId, req.params.filename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    res.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error reading file ${req.params.filename} for channel ${req.params.channelId}:`, error);
    res.status(500).json({ error: 'Failed to read channel file', details: errorMessage });
  }
});

// Add workspace info endpoint
router.get('/workspace-info', async (req, res) => {
  const workspace = req.query.workspace;
  if (!workspace || typeof workspace !== 'string') {
    return res.status(400).json({ error: 'Workspace parameter is required' });
  }

  try {
    const workspacePath = getWorkspacePath(workspace);
    const workspaceFile = path.join(workspacePath, 'workspace.json');
    
    if (!await fs.access(workspaceFile).then(() => true).catch(() => false)) {
      return res.status(404).json({ error: 'Workspace info not found' });
    }

    const workspaceData = await fs.readFile(workspaceFile, 'utf-8');
    const workspaceInfo = JSON.parse(workspaceData);
    res.json(workspaceInfo);
  } catch (error) {
    console.error('Error reading workspace info:', error);
    res.status(500).json({ error: 'Failed to read workspace info' });
  }
});

export default router; 