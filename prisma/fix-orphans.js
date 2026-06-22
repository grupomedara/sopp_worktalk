/**
 * Fix orphan People and Projects that have NULL userId/ownerId.
 * These belong to the SuperAdmin (they existed before the multitenancy fix).
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SUPERADMIN_DOC = '31020403810';

async function main() {
    const superAdmin = await prisma.user.findUnique({ where: { document: SUPERADMIN_DOC } });
    if (!superAdmin) { console.error('❌ SuperAdmin not found'); return; }

    console.log(`✅ SuperAdmin: ${superAdmin.name} (${superAdmin.id})\n`);

    // Fix People without userId → assign to SuperAdmin
    const fixedPeople = await prisma.person.updateMany({
        where: { userId: null },
        data: { userId: superAdmin.id }
    });
    console.log(`👤 People atribuídas ao SuperAdmin: ${fixedPeople.count}`);

    // Fix Projects without ownerId → assign to SuperAdmin
    const fixedProjects = await prisma.project.updateMany({
        where: { ownerId: null },
        data: { ownerId: superAdmin.id }
    });
    console.log(`📁 Projects atribuídos ao SuperAdmin: ${fixedProjects.count}`);

    // Verify
    const nullPeople = await prisma.person.count({ where: { userId: null } });
    const nullProjects = await prisma.project.count({ where: { ownerId: null } });
    console.log(`\n✅ People sem userId: ${nullPeople}`);
    console.log(`✅ Projects sem ownerId: ${nullProjects}`);

    // Final counts
    const saPeople = await prisma.person.count({ where: { userId: superAdmin.id } });
    const saProjects = await prisma.project.count({ where: { ownerId: superAdmin.id } });
    console.log(`\n📊 SuperAdmin agora tem: ${saPeople} people, ${saProjects} projects`);
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); });
