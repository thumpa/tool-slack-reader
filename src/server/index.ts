import express from 'express';
import cors from 'cors';
import { join } from 'path';
import apiRouter from './api';
import { WorkspaceService } from '../utils/workspace-service';

const app = express();
const port = process.env.PORT || 3002;

// Initialize workspace service
const workspaceService = WorkspaceService.getInstance();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(process.cwd(), 'public')));

// API routes
app.use('/api', apiRouter);

// Workspace endpoint
app.get('/api/workspaces', async (req, res) => {
  try {
    const workspaces = await workspaceService.getWorkspaces();
    res.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}).on('error', (error: Error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 