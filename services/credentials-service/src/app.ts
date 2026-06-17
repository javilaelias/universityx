import express from 'express';
import credentialRoutes from './routes/credential.routes';

export const app = express();
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'credentials-service' }),
);
app.use('/credentials', credentialRoutes);
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
