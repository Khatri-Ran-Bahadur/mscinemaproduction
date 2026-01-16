/**
 * Centralized logging utility for tracking payment flows
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

/**
 * Write log entry to file
 */
function writeLog(filename, level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  const logFile = path.join(LOG_DIR, filename);

  try {
    fs.appendFileSync(logFile, logLine, 'utf8');
  } catch (error) {
    console.error(`Failed to write to log file ${filename}:`, error);
  }

  // Also log to console
  const consoleMsg = `[${timestamp}] [${level}] ${message}`;
  switch (level) {
    case LogLevel.ERROR:
      console.error(consoleMsg, data || '');
      break;
    case LogLevel.WARN:
      console.warn(consoleMsg, data || '');
      break;
    case LogLevel.DEBUG:
      console.debug(consoleMsg, data || '');
      break;
    default:
      console.log(consoleMsg, data || '');
  }
}

/**
 * Payment logger - tracks all payment-related operations
 */
export class PaymentLogger {
  constructor(orderid) {
    this.orderid = orderid || 'unknown';
    this.logFile = `payment-${this.orderid}.log`;
  }

  debug(message, data) {
    writeLog(this.logFile, LogLevel.DEBUG, `[${this.orderid}] ${message}`, data);
  }

  info(message, data) {
    writeLog(this.logFile, LogLevel.INFO, `[${this.orderid}] ${message}`, data);
  }

  warn(message, data) {
    writeLog(this.logFile, LogLevel.WARN, `[${this.orderid}] ${message}`, data);
  }

  error(message, data) {
    writeLog(this.logFile, LogLevel.ERROR, `[${this.orderid}] ${message}`, data);
  }

  /**
   * Log API call details
   */
  logApiCall(apiName, url, params, method = 'POST') {
    this.info(`API Call: ${apiName}`, {
      url,
      method,
      params,
    });
  }

  /**
   * Log API response
   */
  logApiResponse(apiName, success, response, error = null) {
    if (success) {
      this.info(`API Success: ${apiName}`, response);
    } else {
      this.error(`API Failed: ${apiName}`, { error, response });
    }
  }

  /**
   * Log payment flow step
   */
  logStep(step, details) {
    this.info(`Step: ${step}`, details);
  }
}

/**
 * General application logger
 */
export class AppLogger {
  constructor(module) {
    this.module = module || 'app';
    this.logFile = `${this.module}.log`;
  }

  debug(message, data) {
    writeLog(this.logFile, LogLevel.DEBUG, `[${this.module}] ${message}`, data);
  }

  info(message, data) {
    writeLog(this.logFile, LogLevel.INFO, `[${this.module}] ${message}`, data);
  }

  warn(message, data) {
    writeLog(this.logFile, LogLevel.WARN, `[${this.module}] ${message}`, data);
  }

  error(message, data) {
    writeLog(this.logFile, LogLevel.ERROR, `[${this.module}] ${message}`, data);
  }
}

export default PaymentLogger;
