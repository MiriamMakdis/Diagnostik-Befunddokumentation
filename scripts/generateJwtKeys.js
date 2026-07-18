import fs from 'node:fs';
import path from 'node:path';
import { generateKeyPairSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const projectRoot = path.resolve(dirname, '..');
const secretsDir = path.join(projectRoot, 'secrets');

const privateKeyPath = path.join(secretsDir, 'jwt-private.pem');
const publicKeyPath = path.join(secretsDir, 'jwt-public.pem');

const force = process.argv.includes('--force');

const removeIfDirectory = (filePath) => {
    if (!fs.existsSync(filePath)) {
      return;
    }
  
    const stat = fs.lstatSync(filePath);
  
    if (stat.isDirectory()) {
      fs.rmSync(filePath, {
        recursive: true,
        force: true
      });
  
      console.log(`Removed directory that should have been a file: ${filePath}`);
    }
  };
  

if (!fs.existsSync(secretsDir)) {
  fs.mkdirSync(secretsDir, { recursive: true });
}

/**
 * Docker kann durch die volume mounts diese Pfade versehentlich als Ordner erzeugen,
 * wenn docker compose gestartet wird, bevor die Key-Dateien existieren.
 * Diese Ordner löschen wir immer, unabhängig vom --force flag.
 */
removeIfDirectory(privateKeyPath);
removeIfDirectory(publicKeyPath);

if (!force && fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
  console.log('JWT keys already exist. Nothing changed.');
  console.log('Use "node scripts/generateJwtKeys.js --force" to overwrite them.');
  process.exit(0);
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

fs.writeFileSync(privateKeyPath, privateKey, {
  encoding: 'utf8',
  mode: 0o600 // unix rechte: rw-------
});

fs.writeFileSync(publicKeyPath, publicKey, {
  encoding: 'utf8',
  mode: 0o644 // unix rechte: rw-r--r--
});

console.log('JWT keys generated successfully:');
console.log(`Private key: ${privateKeyPath}`);
console.log(`Public key:  ${publicKeyPath}`);