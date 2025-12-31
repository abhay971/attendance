import { FastifyInstance } from 'fastify';
import { attendanceService } from './attendance.service.js';
import { checkInSchema, checkOutSchema, historyQuerySchema } from './attendance.schema.js';
import { authenticate } from '../../middlewares/authenticate.js';

export async function attendanceRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  // Check in
  fastify.post('/check-in', async (request, reply) => {
    try {
      const body = checkInSchema.parse(request.body);
      const attendance = await attendanceService.checkIn(request.user!.userId, body);

      return reply.send({
        success: true,
        data: attendance,
        message: 'Checked in successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check-in failed';
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message,
      });
    }
  });

  // Check out
  fastify.post('/check-out', async (request, reply) => {
    try {
      const body = checkOutSchema.parse(request.body);
      const attendance = await attendanceService.checkOut(request.user!.userId, body);

      return reply.send({
        success: true,
        data: attendance,
        message: 'Checked out successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check-out failed';
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message,
      });
    }
  });

  // Get current status
  fastify.get('/status', async (request, reply) => {
    try {
      const status = await attendanceService.getStatus(request.user!.userId);

      return reply.send({
        success: true,
        data: status,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get status',
      });
    }
  });

  // Get history
  fastify.get('/history', async (request, reply) => {
    try {
      const query = historyQuerySchema.parse(request.query);
      const result = await attendanceService.getHistory(request.user!.userId, query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get history',
      });
    }
  });

  // Get stats
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await attendanceService.getStats(request.user!.userId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get stats',
      });
    }
  });
}
