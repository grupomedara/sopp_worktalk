/**
 * Verification script: checks data integrity for both users.
 * Run: node prisma/verify-data.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const superAdmin = await prisma.user.findUnique({ where: { document: '31020403810' } });
    const teste = await prisma.user.findUnique({ where: { document: '12345678900' } });

    if (!superAdmin) { console.error('❌ SuperAdmin NOT FOUND!'); return; }

    console.log('═══════════════════════════════════════════');
    console.log('📊 VERIFICAÇÃO DE DADOS - SUPER ADMIN');
    console.log('═══════════════════════════════════════════');
    console.log(`User: ${superAdmin.name} (${superAdmin.id})`);

    const sa = superAdmin.id;
    const counts = {
        people: await prisma.person.count({ where: { userId: sa } }),
        projects: await prisma.project.count({ where: { ownerId: sa } }),
        goals: await prisma.goal.count({ where: { userId: sa } }),
        tasks: await prisma.task.count({ where: { userId: sa } }),
        events: await prisma.event.count({ where: { userId: sa } }),
        finances: await prisma.finance.count({ where: { userId: sa } }),
        studies: await prisma.study.count({ where: { userId: sa } }),
        notes: await prisma.note.count({ where: { userId: sa } }),
        books: await prisma.book.count({ where: { userId: sa } }),
        lessons: await prisma.lesson.count({ where: { userId: sa } }),
        fichamentos: await prisma.fichamento.count({ where: { userId: sa } }),
        prayers: await prisma.prayer.count({ where: { userId: sa } }),
        interactions: await prisma.interaction.count({ where: { userId: sa } }),
        biblePlans: await prisma.userBiblePlan.count({ where: { userId: sa } }),
    };

    let totalSA = 0;
    for (const [key, val] of Object.entries(counts)) {
        console.log(`  ${key}: ${val}`);
        totalSA += val;
    }
    console.log(`  TOTAL: ${totalSA}`);

    // Check for null userId records
    const nullCounts = {
        goals: await prisma.goal.count({ where: { userId: null } }),
        tasks: await prisma.task.count({ where: { userId: null } }),
        events: await prisma.event.count({ where: { userId: null } }),
        finances: await prisma.finance.count({ where: { userId: null } }),
        studies: await prisma.study.count({ where: { userId: null } }),
        notes: await prisma.note.count({ where: { userId: null } }),
        lessons: await prisma.lesson.count({ where: { userId: null } }),
        fichamentos: await prisma.fichamento.count({ where: { userId: null } }),
        interactions: await prisma.interaction.count({ where: { userId: null } }),
        people: await prisma.person.count({ where: { userId: null } }),
    };
    const totalNull = Object.values(nullCounts).reduce((a, b) => a + b, 0);
    console.log(`\n⚠️  Records sem userId: ${totalNull}`);

    if (teste) {
        console.log('\n═══════════════════════════════════════════');
        console.log('📊 VERIFICAÇÃO DE DADOS - TESTE');
        console.log('═══════════════════════════════════════════');
        console.log(`User: ${teste.name} (${teste.id})`);

        const t = teste.id;
        const tCounts = {
            people: await prisma.person.count({ where: { userId: t } }),
            projects: await prisma.project.count({ where: { ownerId: t } }),
            goals: await prisma.goal.count({ where: { userId: t } }),
            tasks: await prisma.task.count({ where: { userId: t } }),
            events: await prisma.event.count({ where: { userId: t } }),
            finances: await prisma.finance.count({ where: { userId: t } }),
            studies: await prisma.study.count({ where: { userId: t } }),
            notes: await prisma.note.count({ where: { userId: t } }),
            books: await prisma.book.count({ where: { userId: t } }),
            lessons: await prisma.lesson.count({ where: { userId: t } }),
            fichamentos: await prisma.fichamento.count({ where: { userId: t } }),
            prayers: await prisma.prayer.count({ where: { userId: t } }),
            interactions: await prisma.interaction.count({ where: { userId: t } }),
            biblePlans: await prisma.userBiblePlan.count({ where: { userId: t } }),
        };

        let totalT = 0;
        for (const [key, val] of Object.entries(tCounts)) {
            console.log(`  ${key}: ${val}`);
            totalT += val;
        }
        console.log(`  TOTAL: ${totalT}`);
    }
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); });
