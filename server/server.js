import { getDb, closeDb } from './src/models/db.js';
import config from './src/config/index.js';
import app from './app.js';

// Start server (standalone mode)
async function start() {
  try {
    await getDb();
    console.log('📦 Database ready');

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`\n🚀 Mission Alpha — URL Shortener`);
      console.log(`   Server running at: http://0.0.0.0:${config.port}`);
      console.log(`   API base: ${config.baseUrl}/api`);
      console.log(`   Client URL: ${config.clientUrl}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});

start();
