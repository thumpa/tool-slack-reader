import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable CORS for development
app.use(cors());

// Serve static files from both dist and public directories
app.use(express.static('dist'));
app.use('/data', express.static('public/data'));

// API endpoint to list channels (directories in public/data)
app.get('/api/channels', async (req, res) => {
  try {
    const dirs = await fs.readdir(join(__dirname, 'public/data'));
    console.log('Available channels:', dirs);
    res.json(dirs);
  } catch (error) {
    console.error('Error reading channels:', error);
    res.status(500).json({ error: 'Failed to list channels' });
  }
});

// API endpoint to list JSON files in a channel directory
app.get('/api/channels/:channel/files', async (req, res) => {
  try {
    const files = await fs.readdir(join(__dirname, 'public/data', req.params.channel));
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    console.log(`Files for channel ${req.params.channel}:`, jsonFiles);
    res.json(jsonFiles);
  } catch (error) {
    console.error(`Error reading files for channel ${req.params.channel}:`, error);
    res.status(500).json({ error: `Failed to list files for channel ${req.params.channel}` });
  }
});

// API endpoint to get a specific JSON file
app.get('/api/channels/:channel/:file', async (req, res) => {
  try {
    const filePath = join(__dirname, 'public/data', req.params.channel, req.params.file);
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error(`Error reading file ${req.params.file}:`, error);
    res.status(500).json({ error: `Failed to read file ${req.params.file}` });
  }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /api/channels');
  console.log('  GET /api/channels/:channel/files');
  console.log('  GET /api/channels/:channel/:file');
}); 