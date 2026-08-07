import serverless from 'serverless-http';
import { getDb } from '../../src/models/db.js';
import app from '../../app.js';

// Initialize DB before first request
let dbInitialized = false;

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // Initialize DB on cold start
  if (!dbInitialized) {
    await getDb();
    dbInitialized = true;
    console.log('📦 Database initialized (serverless)');
  }

  return serverlessHandler(event, context);
};
