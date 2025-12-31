import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    request.user = {
      userId: payload.userId,
      role: payload.role,
    };
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}
