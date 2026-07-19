import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import demoUsers from '../users/demoUsers.js';

const getPrivateKey = () => {
  const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;

  if (!privateKeyPath) {
    throw new Error('JWT_PRIVATE_KEY_PATH ist nicht gesetzt.');
  }

  return fs.readFileSync(privateKeyPath, 'utf8');
};

const findUserByUsername = (username) => {
  return demoUsers.find((user) => user.username === username);
};

const buildTokenPayload = (user) => {
  return {
    sub: user.sub,
    username: user.username,
    displayName: user.displayName,
    organizationId: user.organizationId,
    role: user.role,
    scopes: user.scopes
  };
};

export const login = ({ username, password }) => {
  const user = findUserByUsername(username);

  if (!user || user.password !== password) {
    const error = new Error('Benutzername oder Passwort ist falsch.');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  const privateKey = getPrivateKey();
  const payload = buildTokenPayload(user);

  const accessToken = jwt.sign(payload, privateKey, {
    algorithm: process.env.JWT_ALGORITHM || 'RS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    issuer: 'auth-service',
    audience: 'workflow-backend'
  });

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    user: {
      sub: user.sub,
      username: user.username,
      displayName: user.displayName,
      organizationId: user.organizationId,
      role: user.role,
      scopes: user.scopes
    }
  };
};

export const getDemoUsers = () => {
  return demoUsers.map((user) => ({
    username: user.username,
    displayName: user.displayName,
    organizationId: user.organizationId,
    role: user.role,
    scopes: user.scopes
  }));
};