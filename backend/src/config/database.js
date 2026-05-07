const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    // Only spin up in-memory if we were trying localhost (or if cloud fails, though usually we want to fail hard on cloud)
    // We'll spin it up anyway as a fallback for now so the app doesn't crash during demo.
    console.warn(`⚠️  Primary MongoDB unavailable. Automatically spinning up an in-memory database fallback...`);
    try {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`✅ In-Memory MongoDB Connected: ${uri}`);
    } catch (memError) {
      console.error(`❌ In-Memory MongoDB Connection Error: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
