import { FastifyInstance } from 'fastify';
import { adminService } from './admin.service.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeesQuerySchema,
  attendanceQuerySchema,
} from './admin.schema.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // All routes require authentication and admin role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', authorize('ADMIN'));

  // Create employee
  fastify.post('/employees', async (request, reply) => {
    try {
      const body = createEmployeeSchema.parse(request.body);
      const employee = await adminService.createEmployee(body);

      return reply.status(201).send({
        success: true,
        data: employee,
        message: 'Employee created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create employee';
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message,
      });
    }
  });

  // Get all employees
  fastify.get('/employees', async (request, reply) => {
    try {
      const query = employeesQuerySchema.parse(request.query);
      const result = await adminService.getEmployees(query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      fastify.log.error(error);
      console.error('Full error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get employees',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get single employee
  fastify.get('/employees/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const employee = await adminService.getEmployee(id);

      return reply.send({
        success: true,
        data: employee,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Employee not found';
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message,
      });
    }
  });

  // Update employee
  fastify.put('/employees/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateEmployeeSchema.parse(request.body);
      const employee = await adminService.updateEmployee(id, body);

      return reply.send({
        success: true,
        data: employee,
        message: 'Employee updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update employee';
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message,
      });
    }
  });

  // Delete (deactivate) employee
  fastify.delete('/employees/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await adminService.deleteEmployee(id);

      return reply.send({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete employee';
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message,
      });
    }
  });

  // Get all attendance records
  fastify.get('/attendance', async (request, reply) => {
    try {
      const query = attendanceQuerySchema.parse(request.query);
      const result = await adminService.getAllAttendance(query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get attendance records',
      });
    }
  });

  // Get dashboard stats
  fastify.get('/dashboard/stats', async (request, reply) => {
    try {
      const stats = await adminService.getDashboardStats();

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get dashboard stats',
      });
    }
  });

  // Get weekly attendance stats for charts
  fastify.get('/dashboard/weekly', async (request, reply) => {
    try {
      const weeklyStats = await adminService.getWeeklyStats();

      return reply.send({
        success: true,
        data: weeklyStats,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get weekly stats',
      });
    }
  });

  // Get department stats
  fastify.get('/dashboard/departments', async (request, reply) => {
    try {
      const departmentStats = await adminService.getDepartmentStats();

      return reply.send({
        success: true,
        data: departmentStats,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get department stats',
      });
    }
  });

  // Get employees who haven't checked in today
  fastify.get('/dashboard/not-checked-in', async (request, reply) => {
    try {
      const employees = await adminService.getEmployeesNotCheckedIn();

      return reply.send({
        success: true,
        data: employees,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get employees not checked in',
      });
    }
  });

  // Get employees currently checked in (need to check out)
  fastify.get('/dashboard/need-checkout', async (request, reply) => {
    try {
      const employees = await adminService.getEmployeesNeedingCheckOut();

      return reply.send({
        success: true,
        data: employees,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get employees needing check out',
      });
    }
  });

  // Get individual employee attendance
  fastify.get('/employees/:id/attendance', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const query = request.query as { startDate?: string; endDate?: string };
      const result = await adminService.getEmployeeAttendance(id, query);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get employee attendance';
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message,
      });
    }
  });
}
