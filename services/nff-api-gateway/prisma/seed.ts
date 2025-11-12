import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin123';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', adminEmail);
  } else {
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin User',
      },
    });
    console.log('Created admin user:', adminUser.email);
  }

  const chartCategories = [
    {
      name: 'Macro',
      description: 'Economic indicators and market trends',
      icon: 'globe',
    },
    {
      name: 'Micro',
      description: 'Individual stock and company analysis',
      icon: 'building',
    },
    {
      name: 'Options',
      description: 'Options trading analysis and derivatives data',
      icon: 'line-chart',
    },
    {
      name: 'CTA',
      description: 'Commodity Trading Advisor strategies',
      icon: 'megaphone',
    },
    {
      name: 'Combination',
      description: 'Multiple category combinations',
      icon: 'layers',
    },
    {
      name: 'Exclusive',
      description: 'Exclusive category for special analysis',
      icon: 'star',
    },
  ];

  for (const category of chartCategories) {
    const result = await prisma.chartCategory.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    console.log('Created/Updated category:', result.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
