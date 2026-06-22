
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.count();
    const projects = await prisma.project.count();
    const people = await prisma.person.count();
    const tasks = await prisma.task.count();

    console.log({ users, projects, people, tasks });
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
