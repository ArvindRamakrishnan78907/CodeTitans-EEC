// Database configuration
const DB_PATH = process.env.DB_PATH || './database/urlshortener.db';

const config = {
  port: process.env.PORT || 3001,
  dbPath: DB_PATH,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  shortCodeLength: 7,
  maxAliasLength: 30,
  minAliasLength: 3,
  reservedWords: [
    'api', 'admin', 'dashboard', 'login', 'signup', 'settings',
    'analytics', 'qr', 'health', 'status', 'docs', 'help'
  ]
};

export default config;
