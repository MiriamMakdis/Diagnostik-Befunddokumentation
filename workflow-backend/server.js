const express = require('express');
//const swaggerJsDoc = require('swagger-jsdoc');
//const swaggerUI = require('swagger-ui-express');

const connectDB = require('./src/db');

const patientRoutes = require('./src/routes/patientsApi');
const workflowRoutes = require('./src/routes/diagnosticWorkflowsApi');
const radiologyRoutes = require('./src/routes/radiologyApi');
const emergencyRoutes = require('./src/routes/emergencyApi');

const notFoundHandler = require('./src/middlewares/notFoundHandler');
const errorHandler = require('./src/middlewares/errorHandler')

const requireAuth = require('./src/middlewares/requireAuth')


//swaggerDocs = swaggerJsDoc(swaggerOptions);
//console.log(swaggerDocs)

const app = express();
app.use(express.json())

connectDB();

app.use(requireAuth);

app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/diagnostic-workflows', workflowRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/radiology', radiologyRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Diagnostik-Befunddokumentation API läuft!' });
});

app.use(notFoundHandler); 
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});