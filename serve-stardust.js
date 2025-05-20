/**
 * Simple HTTP server to display the 406 Stardust Ct property analysis page
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3500;

// Serve static files
app.use(express.static(__dirname));

// Serve the Stardust property page as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'stardust-property.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`406 Stardust Ct Property Analysis available at http://0.0.0.0:${PORT}/`);
  console.log(`You can view the detailed property analysis in your browser`);
});