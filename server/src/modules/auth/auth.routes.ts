import { FastifyInstance } from 'fastify';
import { authService } from './auth.service.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { config } from '../../config/index.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Login - with rate limiting
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 30, // max 30 login attempts
        timeWindow: '15 minutes', // per 15 minutes
      },
    },
  }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const result = await authService.login(body);

      // Return both tokens in response body for client-side storage
      return reply.send({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message,
      });
    }
  });

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    try {
      const body = request.body as any;
      const refreshToken = body?.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'No refresh token provided',
        });
      }

      const result = await authService.refresh(refreshToken);

      return reply.send({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: refreshToken,
        },
      });
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid refresh token',
      });
    }
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    const body = request.body as any;
    const refreshToken = body?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    return reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  });

  // Get current user
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const user = await authService.getMe(request.user!.userId);

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    }
  });

  // Change password
  fastify.put('/change-password', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const body = changePasswordSchema.parse(request.body);
      const result = await authService.changePassword(request.user!.userId, body);

      return reply.send({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message,
      });
    }
  });
}
