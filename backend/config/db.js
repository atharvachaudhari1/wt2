const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGO_URI or MONGODB_URI in environment');
  }
  const options = {
    maxPoolSize: 10,
  };
  await mongoose.connect(uri, options);
  console.log('MongoDB connected');
};

module.exports = connectDB;
