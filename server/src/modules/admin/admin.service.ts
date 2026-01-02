import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../utils/password.js';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeesQuery,
  AttendanceQuery,
} from './admin.schema.js';

export class AdminService {
  async createEmployee(input: CreateEmployeeInput) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        department: input.department,
        position: input.position,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        department: true,
        position: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getEmployees(query: EmployeesQuery) {
    const { page, limit, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          department: true,
          position: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployee(id: string) {
    const employee = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        department: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { attendance: true },
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee;
  }

  async updateEmployee(id: string, input: UpdateEmployeeInput) {
    const employee = await prisma.user.findUnique({ where: { id } });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (input.email && input.email !== employee.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    const updateData: any = { ...input };

    if (input.password) {
      updateData.password = await hashPassword(input.password);
    }

    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        department: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedEmployee;
  }

  async deleteEmployee(id: string) {
    const employee = await prisma.user.findUnique({ where: { id } });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Employee deactivated successfully' };
  }

  async permanentlyDeleteEmployee(id: string) {
    const employee = await prisma.user.findUnique({ where: { id } });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.role === 'ADMIN') {
      // Count total admins
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    // Delete related data first (foreign key constraints)
    await prisma.$transaction([
      // Delete all attendance records
      prisma.attendance.deleteMany({ where: { userId: id } }),
      // Delete all refresh tokens
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      // Finally delete the user
      prisma.user.delete({ where: { id } }),
    ]);

    return { message: 'Employee permanently deleted' };
  }

  async getAllAttendance(query: AttendanceQuery) {
    const { page, limit, userId, startDate, endDate, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      user: { role: 'EMPLOYEE' }, // Only show employee attendance
    };

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.checkInTime = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.checkInTime.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        where.checkInTime.lte = end;
      }
    }

    if (status) {
      where.status = status;
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { checkInTime: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDashboardStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalEmployees,
      activeEmployees,
      todayCheckIns,
      currentlyCheckedIn,
      monthlyAttendance,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.user.count({ where: { role: 'EMPLOYEE', isActive: true } }),
      prisma.attendance.count({
        where: {
          checkInTime: { gte: today },
          user: { role: 'EMPLOYEE' }
        },
      }),
      prisma.attendance.count({
        where: {
          status: 'CHECKED_IN',
          user: { role: 'EMPLOYEE' }
        },
      }),
      prisma.attendance.count({
        where: {
          checkInTime: { gte: startOfMonth },
          user: { role: 'EMPLOYEE' }
        },
      }),
    ]);

    // Get recent attendance
    const recentAttendance = await prisma.attendance.findMany({
      take: 10,
      orderBy: { checkInTime: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
    });

    return {
      totalEmployees,
      activeEmployees,
      todayCheckIns,
      currentlyCheckedIn,
      monthlyAttendance,
      recentAttendance,
    };
  }

  async getWeeklyStats() {
    const now = new Date();
    const weekData = [];

    // Get data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const checkIns = await prisma.attendance.count({
        where: {
          checkInTime: {
            gte: date,
            lt: nextDay,
          },
        },
      });

      const checkOuts = await prisma.attendance.count({
        where: {
          checkOutTime: {
            gte: date,
            lt: nextDay,
          },
          status: 'CHECKED_OUT',
        },
      });

      weekData.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        checkIns,
        checkOuts,
      });
    }

    return weekData;
  }

  async getDepartmentStats() {
    const departments = await prisma.user.groupBy({
      by: ['department'],
      where: {
        role: 'EMPLOYEE',
        isActive: true,
        department: { not: null },
      },
      _count: true,
    });

    // Get today's attendance by department
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Promise.all(
      departments.map(async (dept) => {
        const attendanceCount = await prisma.attendance.count({
          where: {
            checkInTime: { gte: today },
            user: { department: dept.department },
          },
        });

        return {
          department: dept.department || 'Unassigned',
          employees: dept._count,
          present: attendanceCount,
        };
      })
    );

    return result;
  }

  async getEmployeesNotCheckedIn() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active employees
    const allEmployees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
      },
    });

    // Get employees who checked in today
    const checkedInToday = await prisma.attendance.findMany({
      where: {
        checkInTime: { gte: today },
        user: { role: 'EMPLOYEE' },
      },
      select: {
        userId: true,
      },
    });

    const checkedInUserIds = new Set(checkedInToday.map((a) => a.userId));

    // Filter employees who haven't checked in
    const notCheckedIn = allEmployees.filter((emp) => !checkedInUserIds.has(emp.id));

    return notCheckedIn;
  }

  async getEmployeesNeedingCheckOut() {
    // Get employees currently checked in
    const checkedIn = await prisma.attendance.findMany({
      where: {
        status: 'CHECKED_IN',
        user: { role: 'EMPLOYEE' },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: {
        checkInTime: 'asc',
      },
    });

    return checkedIn.map((attendance) => ({
      ...attendance.user,
      checkInTime: attendance.checkInTime,
      checkInAddress: attendance.checkInAddress,
      attendanceId: attendance.id,
    }));
  }

  async getEmployeeAttendance(employeeId: string, query?: { startDate?: string; endDate?: string }) {
    // Verify employee exists and is an employee
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
        role: true,
        isActive: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.role !== 'EMPLOYEE') {
      throw new Error('User is not an employee');
    }

    const where: any = { userId: employeeId };

    if (query?.startDate || query?.endDate) {
      where.checkInTime = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        where.checkInTime.gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999); // End of day
        where.checkInTime.lte = end;
      }
    }

    const [attendance, totalRecords] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { checkInTime: 'desc' },
        take: 50,
      }),
      prisma.attendance.count({ where }),
    ]);

    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [monthlyCount, weeklyCount] = await Promise.all([
      prisma.attendance.count({
        where: {
          userId: employeeId,
          checkInTime: { gte: startOfMonth },
        },
      }),
      prisma.attendance.count({
        where: {
          userId: employeeId,
          checkInTime: { gte: startOfWeek },
        },
      }),
    ]);

    // Calculate average work hours this month
    const monthlyRecords = await prisma.attendance.findMany({
      where: {
        userId: employeeId,
        checkInTime: { gte: startOfMonth },
        status: 'CHECKED_OUT',
      },
    });

    let totalWorkHours = 0;
    monthlyRecords.forEach((record) => {
      if (record.checkOutTime) {
        const diff = record.checkOutTime.getTime() - record.checkInTime.getTime();
        totalWorkHours += diff / (1000 * 60 * 60);
      }
    });

    const avgWorkHours = monthlyRecords.length > 0 ? totalWorkHours / monthlyRecords.length : 0;

    return {
      employee,
      attendance,
      stats: {
        totalRecords,
        monthlyAttendance: monthlyCount,
        weeklyAttendance: weeklyCount,
        avgWorkHoursThisMonth: Math.round(avgWorkHours * 100) / 100,
      },
    };
  }
}

export const adminService = new AdminService();
