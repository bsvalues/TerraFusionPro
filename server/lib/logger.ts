import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

// Configuration options
const options = {
  console: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
      )
    ),
  },
  file: {
    level: 'info',
    filename: 'logs/app.log',
    handleExceptions: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: structuredFormat,
  },
};

// Create transports array
const transports = [
  new winston.transports.Console(options.console),
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(new winston.transports.File(options.file));
}

// Add Elasticsearch transport if configured
if (process.env.ELASTICSEARCH_URL) {
  const esTransport = new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
      },
    },
    indexPrefix: 'terrafusion-logs',
  });
  
  transports.push(esTransport);
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: { service: 'terrafusion-api' },
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan integration
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Add request context support
export const addRequestContext = (req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || require('uuid').v4();
  
  // Add request context to each log entry
  req.logger = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // Add the requestId to response headers
  res.setHeader('X-Request-Id', requestId);
  
  next();
};

// Module exports
export default logger;