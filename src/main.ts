import express from 'express';
import * as dotenv from 'dotenv';
import { database } from './db/database';
import adminRoutes from './modules/admin/admin.routes';
import dataRoutes from './modules/data/data.routes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const SKIP_DB = process.env.SKIP_DATABASE === 'true'; // Debug flag

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
    // Database connection (optional for debugging)
    if (!SKIP_DB) {
      console.log('🔌 Connecting to database...');
      await database.connect();
      console.log('✓ Database connected');
    } else {
      console.log('⏭️  Skipping database connection (SKIP_DATABASE=true)');
    }

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('════════════════════════════════════════════════════════');
      console.log('✅ SERVER STARTED SUCCESSFULLY');
      console.log('════════════════════════════════════════════════════════');
      console.log(`📌 Listening on: http://0.0.0.0:${PORT}`);
      console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📌 Database: ${SKIP_DB ? 'DISABLED' : 'ENABLED'}`);
      console.log('════════════════════════════════════════════════════════');
      console.log('');
    });

    // Log errors
    server.on('error', (err: any) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Si es por base de datos, esperar y reintentar
    if (error instanceof Error && error.message.includes('database')) {
      console.error('⚠️  Database connection failed during startup');
      console.error('💡 Tip: Try SKIP_DATABASE=true to test without database');
      process.exit(1);
    }
    
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('');
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  try {
    if (!SKIP_DB) {
      await database.close();
    }
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('');
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  try {
    if (!SKIP_DB) {
      await database.close();
    }
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});
