const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const sa = '26967e9b-564e-42c5-9d61-7923ed5665cf';
    const userPlans = await p.userBiblePlan.findMany({ where: { userId: sa } });
    
    console.log('=== User Enrollments (SuperAdmin) ===');
    for (const up of userPlans) {
        const bp = await p.bibleReadingPlan.findUnique({ where: { id: up.planId } });
        console.log(`Enrollment ID: ${up.id} | Plan: ${bp ? bp.title : 'Plan Deleted!'} | Status: ${up.status}`);
    }

    console.log('\n=== All Bible Reading Plan Templates ===');
    const templates = await p.bibleReadingPlan.findMany();
    templates.forEach(t => console.log(`- ${t.title} (ID: ${t.id})`));
}

main()
    .then(() => p.$disconnect())
    .catch(e => { console.error(e); p.$disconnect(); });
