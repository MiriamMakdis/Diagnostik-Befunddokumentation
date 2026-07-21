const mongoose = require('mongoose');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/diagnostik';

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      console.log(`MongoDB-Verbindungsversuch ${attempt}: ${mongoUri}`);
      await mongoose.connect(mongoUri);
      console.log('MongoDB verbunden');
      return;
    } catch (error) {
      console.error(
        `MongoDB-Verbindung fehlgeschlagen, Versuch ${attempt}/10:`,
        error.message
      );

      if (attempt === 10) {
        throw error;
      }

      await sleep(3000);
    }
  }
};

module.exports = connectDB;