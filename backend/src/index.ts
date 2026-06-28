import './config/env'; // load env first
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import familyRoutes from './routes/family.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.nodeEnv === 'production' ? false : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv });
});

app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`FamilyVault backend running on port ${env.port} [${env.nodeEnv}]`);
});

export default app;
