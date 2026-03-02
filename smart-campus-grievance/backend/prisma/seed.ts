import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const passwordHash = await bcrypt.hash('password123', 10);

    const student = await prisma.user.upsert({
        where: { email: 'student@test.com' },
        update: {},
        create: {
            email: 'student@test.com',
            passwordHash,
            role: 'STUDENT',
        },
    });

    const faculty = await prisma.user.upsert({
        where: { email: 'faculty@test.com' },
        update: {},
        create: {
            email: 'faculty@test.com',
            passwordHash,
            role: 'FACULTY',
            department: 'Academic',
        },
    });

    const admin = await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
            email: 'admin@test.com',
            passwordHash,
            role: 'ADMIN',
        },
    });

    console.log({ student, faculty, admin });
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
