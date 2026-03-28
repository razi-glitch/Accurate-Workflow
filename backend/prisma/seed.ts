import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // Create Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'System Admin',
      passwordHash: adminPasswordHash,
      role: 'Admin',
    },
  });

  // Create Designers
  const designers = [
    { user: 'mrazi', name: 'Muhammed Razi' },
    { user: 'mrahman', name: 'Mujeeb Rahman K' },
    { user: 'niveditha', name: 'Niveditha EC' },
    { user: 'nkrishna', name: 'Naveen Krishna' }
  ];
  for (const d of designers) {
    await prisma.user.upsert({
      where: { username: d.user },
      update: {},
      create: {
        username: d.user,
        fullName: d.name,
        passwordHash: await bcrypt.hash('designer123', 10),
        role: 'Designer',
      },
    });
  }

  // Create Client Relations
  const clientRelations = [
    { user: 'gireesh', name: 'Gireesh' },
    { user: 'akshay', name: 'Akshay' },
    { user: 'akhil', name: 'Akhil' },
    { user: 'suresh', name: 'Suresh' },
    { user: 'jibin', name: 'Jibin' },
    { user: 'abhilash', name: 'Abhilash' }
  ];
  for (const c of clientRelations) {
    await prisma.user.upsert({
      where: { username: c.user },
      update: {},
      create: {
        username: c.user,
        fullName: c.name,
        passwordHash: await bcrypt.hash('client123', 10),
        role: 'Client Relations',
      },
    });
  }

  // Create Default Options
  const materials = ['Semi Glossy', 'Semi Silver', 'Glossy', 'PP White', 'PP Silver', 'PP Clear'];
  const colors = ['Single Colour', 'Cmyk', 'Cmyk+White'];
  const windings = ['1 - Sleeping Clockwise', '2 - Sleeping Anticlockwise', '3 - Standing Clockwise', '4 - Standing Anticlockwise', 'Manual'];
  const finishes = ['None', 'Glossy Varnish', 'Matt Varnish', 'Glossy Lamination', 'Matt Lamination', 'Spot Uv', 'Foil Stamping'];

  for (const m of materials) await prisma.materialOption.upsert({ where: { name: m }, update: {}, create: { name: m } });
  for (const c of colors) await prisma.colorOption.upsert({ where: { name: c }, update: {}, create: { name: c } });
  for (const w of windings) await prisma.windingOption.upsert({ where: { name: w }, update: {}, create: { name: w } });
  for (const f of finishes) await prisma.finishingOption.upsert({ where: { name: f }, update: {}, create: { name: f } });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
