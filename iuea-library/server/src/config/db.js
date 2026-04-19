const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URI;
  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    console.error('MONGODB_URI must be a valid MongoDB connection string (mongodb:// or mongodb+srv://).');
    process.exit(1);
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS:          30000,
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;
