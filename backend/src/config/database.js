const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error.message);
      if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: Database connection failed in production.');
        process.exit(1);
      }
    }
  }

  // Fallback to In-Memory only in non-production environments
  console.warn(`⚠️  Primary MongoDB unavailable or not configured. Attempting in-memory fallback...`);
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`✅ In-Memory MongoDB Connected: ${uri}`);
  } catch (memError) {
    console.error(`❌ In-Memory MongoDB Connection Error: ${memError.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
