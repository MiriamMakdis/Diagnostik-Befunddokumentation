const express = require('express');
//const swaggerJsDoc = require('swagger-jsdoc');
//const swaggerUI = require('swagger-ui-express');

const connectDB = require('./src/db');

const patientRoutes = require('./src/routes/patientsApi');
const workflowRoutes = require('./src/routes/diagnosticWorkflowsApi');
const radiologyRoutes = require('./src/routes/radiologyApi');
const emergencyRoutes = require('./src/routes/emergencyApi');

const auth
const notFoundHandler = require('./src/middlewares/notFoundHandler');
const errorHandler = require('./src/middlewares/errorHandler')

const requireAuth = require('./src/middlewares/requireAuth')


//swaggerDocs = swaggerJsDoc(swaggerOptions);
//console.log(swaggerDocs)

const app = express();
app.use(express.json)

connectDB();

app.use(()=>console.log("using stuff"));
app.use(requireAuth);

app.use('/api/patients', patientRoutes);
app.use('/api/diagnostic-workflows', workflowRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/radiology', radiologyRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Diagnostik-Befunddokumentation API läuft!' });
});

app.use(notFoundHandler); 
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});