import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';

export function authorize(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      });
    }
  };
}
