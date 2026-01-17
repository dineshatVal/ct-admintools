/**
 * Logger utility to control console output based on environment
 * This helps eliminate excessive console logging in production
 *
 * Usage:
 *
 * 1. Import the logger:
 *    import logger from '../../utils/logger';
 *
 * 2. Replace console.log calls with logger methods:
 *    - logger.log() - Basic logging (hidden in production)
 *    - logger.info() - Informational logging (hidden in production)
 *    - logger.warn() - Warning messages (shown in all environments)
 *    - logger.error() - Error messages (always shown)
 *    - logger.debug() - Verbose debugging (hidden in production)
 *    - logger.performance() - Performance timing (hidden in production)
 *
 * 3. Examples:
 *    logger.log('Loading component');
 *    logger.info(`Fetched ${items.length} items`);
 *    logger.warn('Deprecated function called');
 *    logger.error('Failed to load data', error);
 *
 *    // Performance timing
 *    const startTime = performance.now();
 *    // ... code to measure ...
 *    logger.performance('Operation name', startTime);
 */

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

// Logger object with methods that match console methods
const logger = {
  log: (message?: any, ...optionalParams: any[]): void => {
    if (!isProduction) {
      console.log(message, ...optionalParams);
    }
  },

  info: (message?: any, ...optionalParams: any[]): void => {
    if (!isProduction) {
      console.info(message, ...optionalParams);
    }
  },

  warn: (message?: any, ...optionalParams: any[]): void => {
    // Always log warnings, but with less detail in production
    if (isProduction) {
      console.warn(message);
    } else {
      console.warn(message, ...optionalParams);
    }
  },

  error: (message?: any, ...optionalParams: any[]): void => {
    // Always log errors
    console.error(message, ...optionalParams);
  },

  // Debug logs for more verbose development logging
  debug: (message?: any, ...optionalParams: any[]): void => {
    if (!isProduction) {
      console.debug(message, ...optionalParams);
    }
  },

  // Method for logging performance metrics
  performance: (label: string, startTime: number): void => {
    if (!isProduction) {
      const duration = performance.now() - startTime;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
  },
};

export default logger;
