import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import authApi from './api/authApi.js';

const require = createRequire(import.meta.url);
const swaggerUiDist = require('swagger-ui-dist');

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const swaggerUiPath = swaggerUiDist.absolutePath();
const docsPath = path.join(dirname, '../docs');

export const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'auth-service'
  });
});

app.use('/docs/swagger-ui', express.static(swaggerUiPath));

app.get('/docs/openapi.json', (req, res) => {
  return res.sendFile(path.join(docsPath, 'openapi.json'));
});

app.get('/docs', (req, res) => {
  return res.sendFile(path.join(docsPath, 'swagger.html'));
});

app.use((err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    status: 'ERROR',
    errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Interner Serverfehler.'
  });
});

app.use('/api/auth', authApi);