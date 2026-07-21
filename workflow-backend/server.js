const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./src/db');

const patientRoutes = require('./src/routes/patientsApi');
const workflowRoutes = require('./src/routes/diagnosticWorkflowsApi');
const radiologyRoutes = require('./src/routes/radiologyApi');
const emergencyRoutes = require('./src/routes/emergencyApi');

const notFoundHandler = require('./src/middlewares/notFoundHandler');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Diagnostik-Befunddokumentation API läuft.'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'workflow-backend'
  });
});

app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/diagnostic-workflows', workflowRoutes);
app.use('/api/v1/radiology', radiologyRoutes);
app.use('/api/v1/emergency', emergencyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server läuft auf http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Server konnte nicht gestartet werden:', error);
    process.exit(1);
  });
