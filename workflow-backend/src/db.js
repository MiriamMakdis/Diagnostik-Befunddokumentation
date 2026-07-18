const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/diagnostik');
    console.log('MongoDB verbunden');
  } catch (err) {
    console.error('MongoDB Fehler:', err);
    process.exit(1);
  }
};

module.exports = connectDB;