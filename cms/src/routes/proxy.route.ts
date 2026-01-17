import { Router, Request, Response, RequestHandler } from 'express';
import { logger } from '../utils/logger.utils';

const proxyRouter = Router();

// Proxy route for external scripts to avoid CORS issues
proxyRouter.get('/proxy-script', (async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).send('URL parameter is required');
    }

    const response = await fetch(url);

    // Set appropriate headers for JavaScript content
    res.setHeader('Content-Type', 'application/javascript');
    const text = await response.text();
    res.send(text);
  } catch (error) {
    logger.error('Error proxying script:', error);
    res.status(500).send('Error proxying script');
  }
}) as RequestHandler);

export default proxyRouter;
