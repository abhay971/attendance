import { Role } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      role: Role;
    };
  }
}
