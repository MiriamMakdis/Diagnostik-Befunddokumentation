import express from 'express';
import { authApi } from './api/authApi.js';

export const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'auth-service'
  });
});

app.use('/api/v1/auth', authApi);