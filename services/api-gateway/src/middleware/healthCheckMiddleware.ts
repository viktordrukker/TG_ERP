import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import logger from '../utils/logger';

// Service health status cache
const serviceHealth: Record<string, boolean> = {
  auth: false,
  org: false,
  communication: false,
  project: false,
  workplace: false,
  analytics: false
};

// Service URLs
const serviceUrls: Record<string, string> = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  org: process.env.ORG_SERVICE_URL || 'http://org-service:3002',
  communication: process.env.COMMUNICATION_SERVICE_URL || 'http://communication-service:3003',
  project: process.env.PROJECT_SERVICE_URL || 'http://project-service:3004',
  workplace: process.env.WORKPLACE_SERVICE_URL || 'http://workplace-service:3005',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3006'
};

/**
 * Check health of all microservices
 */
export const checkServicesHealth = async (): Promise<void> => {
  for (const [service, url] of Object.entries(serviceUrls)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 2000 });
      const isHealthy = response.status === 200 && response.data?.status === 'ok';
      
      // Update service health status
      if (serviceHealth[service] !== isHealthy) {
        if (isHealthy) {
          logger.info(`Service ${service} is now healthy`);
        } else {
          logger.warn(`Service ${service} is now unhealthy`);
        }
        serviceHealth[service] = isHealthy;
      }
    } catch (error) {
      if (serviceHealth[service]) {
        logger.warn(`Service ${service} is now unhealthy`, { error: error.message });
        serviceHealth[service] = false;
      }
    }
  }
};

/**
 * Start health check interval
 */
export const startHealthChecks = (): NodeJS.Timeout => {
  // Initial health check
  checkServicesHealth();
  
  // Schedule regular health checks
  return setInterval(checkServicesHealth, 30000); // Check every 30 seconds
};

// Start health checks when the middleware is loaded
const healthCheckInterval = startHealthChecks();

// Ensure the interval is cleared when the process exits
process.on('exit', () => {
  clearInterval(healthCheckInterval);
});

/**
 * Health check middleware
 * Responds to /health endpoint with service statuses
 */
export const healthCheckMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if this is a health check request
  if (req.path === '/health') {
    const allHealthy = Object.values(serviceHealth).every(status => status);
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      service: 'api-gateway',
      dependencies: serviceHealth,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // Not a health check, continue to next middleware
  next();
};
