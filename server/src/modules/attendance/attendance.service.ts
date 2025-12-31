import { prisma } from '../../lib/prisma.js';
import { reverseGeocode } from '../../lib/geocoding.js';
import { CheckInInput, CheckOutInput, HistoryQuery } from './attendance.schema.js';

export class AttendanceService {
  async checkIn(userId: string, input: CheckInInput) {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if user already has an active check-in
    const activeCheckIn = await prisma.attendance.findFirst({
      where: {
        userId,
        status: 'CHECKED_IN',
      },
    });

    if (activeCheckIn) {
      throw new Error('You are already checked in. Please check out first.');
    }

    // Check if user already completed attendance for today
    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
        status: 'CHECKED_OUT',
      },
    });

    if (todayAttendance) {
      throw new Error('You have already completed your attendance for today. See you tomorrow!');
    }

    // Get address from coordinates
    const { address } = await reverseGeocode(input.lat, input.lng);

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        checkInTime: new Date(),
        checkInLat: input.lat,
        checkInLng: input.lng,
        checkInAddress: address,
        notes: input.notes,
        status: 'CHECKED_IN',
      },
    });

    return attendance;
  }

  async checkOut(userId: string, input: CheckOutInput) {
    // Find active check-in
    const activeCheckIn = await prisma.attendance.findFirst({
      where: {
        userId,
        status: 'CHECKED_IN',
      },
    });

    if (!activeCheckIn) {
      throw new Error('No active check-in found. Please check in first.');
    }

    // Get address from coordinates
    const { address } = await reverseGeocode(input.lat, input.lng);

    const attendance = await prisma.attendance.update({
      where: { id: activeCheckIn.id },
      data: {
        checkOutTime: new Date(),
        checkOutLat: input.lat,
        checkOutLng: input.lng,
        checkOutAddress: address,
        status: 'CHECKED_OUT',
        notes: input.notes ? `${activeCheckIn.notes || ''}\n${input.notes}`.trim() : activeCheckIn.notes,
      },
    });

    return attendance;
  }

  async getStatus(userId: string) {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeCheckIn = await prisma.attendance.findFirst({
      where: {
        userId,
        status: 'CHECKED_IN',
      },
    });

    // Check if already completed for today
    const completedToday = await prisma.attendance.findFirst({
      where: {
        userId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
        status: 'CHECKED_OUT',
      },
    });

    return {
      isCheckedIn: !!activeCheckIn,
      hasCompletedToday: !!completedToday,
      currentAttendance: activeCheckIn,
      todayAttendance: completedToday,
    };
  }

  async getHistory(userId: string, query: HistoryQuery) {
    const { page, limit, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (startDate || endDate) {
      where.checkInTime = {};
      if (startDate) {
        where.checkInTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.checkInTime.lte = new Date(endDate);
      }
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { checkInTime: 'desc' },
        skip,
        take: limit,
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

  async getStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [monthlyCount, weeklyCount, todayAttendance, totalRecords] = await Promise.all([
      prisma.attendance.count({
        where: {
          userId,
          checkInTime: { gte: startOfMonth },
        },
      }),
      prisma.attendance.count({
        where: {
          userId,
          checkInTime: { gte: startOfWeek },
        },
      }),
      prisma.attendance.findFirst({
        where: {
          userId,
          checkInTime: { gte: today },
        },
      }),
      prisma.attendance.count({ where: { userId } }),
    ]);

    // Calculate average work hours this month
    const monthlyRecords = await prisma.attendance.findMany({
      where: {
        userId,
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
      totalRecords,
      monthlyAttendance: monthlyCount,
      weeklyAttendance: weeklyCount,
      todayCheckedIn: !!todayAttendance,
      avgWorkHoursThisMonth: Math.round(avgWorkHours * 100) / 100,
    };
  }
}

export const attendanceService = new AttendanceService();
