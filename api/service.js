import express from 'express';
import { createServer } from '@vercel/node';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express on Vercel');
});

export default app;
