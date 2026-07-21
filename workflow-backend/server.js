const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./src/db');

const path = require('node:path');
const swaggerUiDist = require('swagger-ui-dist');

const swaggerUiPath = swaggerUiDist.absolutePath();
const docsPath = path.join(__dirname, 'docs');

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
  res.status(200).json({
    status: 'UP',
    service: 'auth-service'
  });
});

app.use('/docs/swagger-ui', express.static(swaggerUiPath));

app.use('/docs', express.static(docsPath));

app.get('/docs/openapi.json', (req, res) => {
  return res.sendFile(path.join(docsPath, 'openapi.json'));
});

app.get('/docs', (req, res) => {
  return res.sendFile(path.join(docsPath, 'swagger.html'));
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
