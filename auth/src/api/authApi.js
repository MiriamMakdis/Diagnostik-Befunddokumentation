import express from 'express';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';

import { login, getDemoUsers } from '../services/authService.js';

const router = express.Router();

const getPublicKey = () => {
  const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

  if (!publicKeyPath) {
    throw new Error('JWT_PUBLIC_KEY_PATH ist nicht gesetzt.');
  }

  return fs.readFileSync(publicKeyPath, 'utf8');
};

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [type, token] = authorizationHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'ERROR',
        errorCode: 'VALIDATION_ERROR',
        message: 'username und password müssen angegeben werden.'
      });
    }

    const result = login({ username, password });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Login erfolgreich.',
      ...result
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        status: 'ERROR',
        errorCode: 'UNAUTHORIZED',
        message: 'Bearer Token fehlt.'
      });
    }

    const publicKey = getPublicKey();

    const decoded = jwt.verify(token, publicKey, {
      algorithms: [process.env.JWT_ALGORITHM || 'RS256'],
      issuer: 'auth-service',
      audience: 'workflow-backend'
    });

    return res.status(200).json({
      status: 'SUCCESS',
      user: {
        sub: decoded.sub,
        username: decoded.username,
        displayName: decoded.displayName,
        organizationId: decoded.organizationId,
        role: decoded.role,
        scopes: decoded.scopes
      }
    });
  } catch (error) {
    error.statusCode = 401;
    error.errorCode = 'INVALID_TOKEN';
    error.message = 'Token ist ungültig oder abgelaufen.';
    return next(error);
  }
});

router.get('/demo-users', (req, res) => {
  return res.status(200).json({
    status: 'SUCCESS',
    users: getDemoUsers()
  });
});

export default router;