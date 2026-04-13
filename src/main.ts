import express from 'express';
import * as dotenv from 'dotenv';
import { config } from './config';
import { database } from './features/sets/sets.repository';
import { errorHandler } from './middleware/error-handler';
import setsRoutes from './features/sets/sets.routes';
import cardsRoutes from './features/cards/cards.routes';
import adminRoutes from './modules/admin/admin.routes';

dotenv.config();

const app = express();

app.use(express.json());

app.use('/api', setsRoutes);
app.use('/api', cardsRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

async function bootstrap() {
  try {
    if (!config.skipDatabase) {
      console.log('🔌 Connecting to database...');
      await database.connect();
      console.log('✓ Database connected');
    } else {
      console.log('⏭️  Skipping database connection (SKIP_DATABASE=true)');
    }

    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log('');
      console.log('════════════════════════════════════════════════════════');
      console.log('✅ SERVER STARTED SUCCESSFULLY');
      console.log('════════════════════════════════════════════════════════');
      console.log(`📌 Listening on: http://0.0.0.0:${config.port}`);
      console.log(`📌 Environment: ${config.nodeEnv}`);
      console.log(`📌 Database: ${config.skipDatabase ? 'DISABLED' : 'ENABLED'}`);
      console.log('════════════════════════════════════════════════════════');
      console.log('');
    });

    server.on('error', (err: Error) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, shutting down...');
  if (!config.skipDatabase) {
    await database.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT received, shutting down...');
  if (!config.skipDatabase) {
    await database.close();
  }
  process.exit(0);
});
