const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI ist nicht gesetzt');
    }
    await mongoose.connect(uri);
    console.log('MongoDB verbunden');
  } catch (err) {
    console.error('MongoDB Verbindungsfehler:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };