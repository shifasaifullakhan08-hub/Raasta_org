const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

// Support both environment variable (for Render / production deployment) and default configured Atlas URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shifasaifullakhan08_db_user:hMLareZyS4SrV1Cn@cluster0.agb1cv1.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'raasta_db';

let client = null;
let database = null;

/**
 * Connect to MongoDB Atlas
 */
async function connectDB() {
  if (database) return database;

  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });

    await client.connect();
    database = client.db(DB_NAME);
    console.log(`✅ Connected successfully to MongoDB Atlas database: ${DB_NAME}`);
    return database;
  } catch (error) {
    console.warn(`⚠️ MongoDB Atlas connection notice: ${error.message}`);
    console.warn('ℹ️ Running in resilient fallback mode (local persistent JSON DB).');
    return null;
  }
}

/**
 * Get MongoDB Database instance (or null if offline/fallback)
 */
function getDB() {
  return database;
}

/**
 * Gracefully close connection on server shutdown
 */
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log('MongoDB connection closed.');
  }
}

module.exports = {
  MONGODB_URI,
  DB_NAME,
  connectDB,
  getDB,
  closeDB
};
