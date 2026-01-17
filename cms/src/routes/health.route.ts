import { Router } from 'express';
import { readConfiguration } from '../utils/config.utils';

const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res
    .status(200)
    .json({ status: 'ok', projectkey: readConfiguration().projectKey });
});

export default healthRouter;
