import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initPool, closePool } from './config/database';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(cors());
app.use(express.json());
app.use(routes);
app.use(errorHandler);

async function start(): Promise<void> {
  await initPool();
  app.listen(port, () => {
    console.log(`ArkIve API rodando em http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});

async function shutdown(): Promise<void> {
  await closePool();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
