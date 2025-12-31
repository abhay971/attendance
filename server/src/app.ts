import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: config.nodeEnv === 'development',
    bodyLimit: 1048576, // 1MB max request body size
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: config.nodeEnv === 'production',
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100, // max 100 requests
    timeWindow: '15 minutes', // per 15 minutes
    skipOnError: false,
  });

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  // Cookie parser
  await fastify.register(cookie);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(attendanceRoutes, { prefix: '/api/attendance' });
  await fastify.register(adminRoutes, { prefix: '/api/admin' });

  // Global error handler
  fastify.setErrorHandler((error: any, request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    reply.status(statusCode).send({
      success: false,
      error: statusCode >= 500 ? 'Internal Server Error' : 'Error',
      message: config.nodeEnv === 'production' && statusCode >= 500
        ? 'Something went wrong'
        : message,
    });
  });

  return fastify;
}
