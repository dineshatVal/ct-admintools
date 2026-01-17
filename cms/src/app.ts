import * as dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express } from 'express';

// Import routes
import ServiceRoutes from './routes/service.route';

import CustomError from './errors/custom.error';
import { errorMiddleware } from './middleware/error.middleware';
import { readConfiguration } from './utils/config.utils';
import { extractMainDomain } from './utils/domain';
import { logger } from './utils/logger.utils';

// Read env variables
readConfiguration();

// Create the express app
const app: Express = express();
app.disable('x-powered-by');

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const domain = extractMainDomain(origin);
      logger.info(`Checking origin: ${origin} with domain: ${domain}`);
      if (process.env.CORS_ALLOWED_ORIGINS?.split(',').includes(domain)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Define configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Define routes
app.use('/service', ServiceRoutes);
app.use('*', () => {
  throw new CustomError(404, 'Path not found.');
});
// Global error handler
app.use(errorMiddleware);

export default app;
