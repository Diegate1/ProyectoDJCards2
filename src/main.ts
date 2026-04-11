import express from 'express';
import * as dotenv from 'dotenv';
import { database } from './db/database';
import adminRoutes from './modules/admin/admin.routes';
import dataRoutes from './modules/data/data.routes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json());

// Routes
app.use('/admin', adminRoutes);
app.use('/api', dataRoutes);

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

async function bootstrap() {
  try {
    console.log('Connecting to database...');
    await database.connect();

    app.listen(PORT as number, '0.0.0.0', () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await database.close();
  process.exit(0);
});
