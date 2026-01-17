import { Router } from 'express';
import { post } from '../controllers/chat.controller';
import { logger } from '../utils/logger.utils';
import { readConfiguration } from '../utils/config.utils';

const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
  try {
    post(req, res);
  } catch (error) {
    logger.error('Error processing chat request:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

chatRouter.get('/ping', async (req, res) => {
  try {
    res.status(200).json({ message: 'pong', projectkey: readConfiguration().projectKey });
  } catch (error) {
    logger.error('Error processing chat request:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default chatRouter;
