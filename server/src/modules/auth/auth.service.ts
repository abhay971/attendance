import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { LoginInput } from './auth.schema.js';

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValidPassword = await verifyPassword(input.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Get complete user data for the response
    const completeUser = await prisma.user.findUnique({
      where: { id: user.id },
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

    return {
      accessToken,
      refreshToken,
      user: completeUser,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Check if token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new Error('Invalid refresh token');
      }

      if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new Error('Refresh token expired');
      }

      if (!storedToken.user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new access token only (keep same refresh token)
      const tokenPayload = { userId: storedToken.userId, role: storedToken.user.role };
      const newAccessToken = generateAccessToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: refreshToken, // Keep the same refresh token
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } catch (error) {
      // Ignore errors during logout
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();
