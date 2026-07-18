const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/diagnostik';

    await mongoose.connect(mongoUri);
    console.log('MongoDB verbunden');
  } catch (err) {
    console.error('MongoDB Fehler:', err);
    process.exit(1);
  }
};

module.exports = connectDB;