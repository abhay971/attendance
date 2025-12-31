import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@attendance.com' },
    update: {},
    create: {
      email: 'admin@attendance.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'Management',
      position: 'Administrator',
    },
  });

  console.log('Admin user created:', admin.email);

  // Create a sample employee
  const employeePassword = await bcrypt.hash('employee123', 12);

  const employee = await prisma.user.upsert({
    where: { email: 'employee@attendance.com' },
    update: {},
    create: {
      email: 'employee@attendance.com',
      password: employeePassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'EMPLOYEE',
      department: 'Engineering',
      position: 'Software Developer',
      phone: '+1234567890',
    },
  });

  console.log('Sample employee created:', employee.email);

  console.log('Seeding completed!');
  console.log('\nDefault credentials:');
  console.log('Admin: admin@attendance.com / admin123');
  console.log('Employee: employee@attendance.com / employee123');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
