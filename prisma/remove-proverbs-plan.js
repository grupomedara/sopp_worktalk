const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const sa = '26967e9b-564e-42c5-9d61-7923ed5665cf';
    console.log(`Checking plans for SuperAdmin: ${sa}`);
    
    const userPlans = await p.userBiblePlan.findMany({
        where: { userId: sa },
        include: { plan: true }
    });
    
    console.log('User Bible Plans:');
    for (const up of userPlans) {
        console.log(`- ID: ${up.id} | Title: ${up.plan.title} | Status: ${up.status}`);
        if (up.plan.title === 'PROVÉRBIOS EM 31 DIAS' || up.plan.title.includes('Provérbios')) {
            console.log(`Found plan to remove: ${up.id}`);
            const deleted = await p.userBiblePlan.delete({
                where: { id: up.id }
            });
            console.log('Deleted successfully:', deleted.id);
        }
    }
}

main()
    .then(() => p.$disconnect())
    .catch((e) => {
        console.error(e);
        p.$disconnect();
        process.exit(1);
    });
