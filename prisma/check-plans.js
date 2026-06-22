const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const sa = '26967e9b-564e-42c5-9d61-7923ed5665cf';
    const plans = await p.userBiblePlan.findMany({ where: { userId: sa } });
    
    for (const pl of plans) {
        const bp = await p.biblePlan.findUnique({ where: { id: pl.planId } });
        console.log(`ID: ${pl.id} | planId: ${pl.planId} | name: ${bp ? bp.name : 'N/A'} | status: ${pl.status} | day: ${pl.currentDay}`);
    }

    // Also check BiblePlan templates
    const allTemplates = await p.biblePlan.findMany();
    console.log('\n=== All BiblePlan Templates ===');
    allTemplates.forEach(t => console.log(`  ${t.id} | ${t.name} | ${t.type} | ${t.duration} days`));
}

main().then(() => p.$disconnect());
