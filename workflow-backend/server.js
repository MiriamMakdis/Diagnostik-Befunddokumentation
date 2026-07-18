const express = require('express');
const connectDB = require('./src/db');
const patientRoutes = require('./src/patient/patient.routes');

const app = express();
app.use(express.json());

connectDB();

app.use('/patient', patientRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Diagnostik-Befunddokumentation API läuft!' });
});

app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});