
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const document = '31020403810'; // User provided CPF (normalized)

    try {
        const existingUser = await prisma.user.findUnique({
            where: { document }
        });

        if (existingUser) {
            console.log("User found, updating to SUPER_ADMIN...");
            const user = await prisma.user.update({
                where: { id: existingUser.id },
                data: { role: 'SUPER_ADMIN' }
            });
            console.log("User updated:", user);
        } else {
            console.log("User not found, creating SUPER_ADMIN...");
            const password = await bcrypt.hash('123456', 10);
            const user = await prisma.user.create({
                data: {
                    document,
                    password,
                    name: 'Super Admin',
                    role: 'SUPER_ADMIN',
                },
            });
            console.log("User created:", user);
        }
    } catch (error) {
        console.error("Error seeding admin:", error);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
