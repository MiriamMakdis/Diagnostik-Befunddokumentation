import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config();

const port = process.env.PORT || 4000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Auth service running on port ${port}`);
});