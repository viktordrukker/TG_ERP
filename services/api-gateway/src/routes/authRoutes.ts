import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '../utils/logger';

const router = express.Router();

// Get Auth service URL from environment variables
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

// Create proxy middleware for Auth service
const authServiceProxy = createProxyMiddleware({
  target: authServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth', // No path rewriting needed for auth routes
  },
  logLevel: 'silent', // We'll handle logging ourselves
  onProxyReq: (proxyReq, req, res) => {
    logger.debug(`Proxying request to Auth service: ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.debug(`Response from Auth service: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error for Auth service: ${err.message}`, { error: err, path: req.path });
    res.status(503).json({
      status: 'error',
      message: 'Authentication service is currently unavailable',
    });
  },
});

// Apply proxy middleware to all auth routes
router.use('/', authServiceProxy);

export default router;
