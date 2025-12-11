import { Router, Request, Response } from 'express';

const router = Router();

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

router.get('/', (_req: Request, res: Response) => {
  const healthCheck: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(healthCheck);
});

export default router;
