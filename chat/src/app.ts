import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// Import routes
import ChatRoutes from './routes/chat.route';

import { errorMiddleware } from './middleware/error.middleware';
import { extractMainDomain } from './domain';
import { logger } from './utils/logger.utils';
import ModelProvider from './services/modelProvider';
import { genericAtuhCheck } from './middleware/authorize-context';

// Initialize the ModelProvider
try {
  ModelProvider.getInstance();
  logger.info('AI Model successfully initialized');
} catch (error) {
  logger.error(`Failed to initialize AI Model: ${error}`);
}

// Create the express app
const app: Express = express();
app.disable('x-powered-by');

app.use(
  cors({
    origin: (origin: any, callback: any) => {
      if (!origin) return callback(null, true);
      const domain = extractMainDomain(origin);
      logger.info(`Checking origin: ${origin} with domain: ${domain}`);
      if (process.env.CORS_ALLOWED_ORIGINS?.split(',').includes(domain)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Define configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(genericAtuhCheck);
// Define routes
app.use('/chat', ChatRoutes);
app.use('*', () => {
  throw new Error('Path not found.');
});
// Global error handler
app.use(errorMiddleware);

export default app;
