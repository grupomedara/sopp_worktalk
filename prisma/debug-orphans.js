const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Check people without userId
    const orphanPeople = await prisma.person.findMany({ where: { userId: null } });
    console.log(`\n=== PEOPLE sem userId (${orphanPeople.length}) ===`);
    orphanPeople.forEach(p => console.log(`  ${p.name} | id: ${p.id}`));

    // Check projects without ownerId
    const orphanProjects = await prisma.project.findMany({ where: { ownerId: null } });
    console.log(`\n=== PROJECTS sem ownerId (${orphanProjects.length}) ===`);
    orphanProjects.forEach(p => console.log(`  ${p.name} | id: ${p.id}`));

    // Check SuperAdmin's people and projects  
    const sa = await prisma.user.findUnique({ where: { document: '31020403810' } });
    const saPeople = await prisma.person.findMany({ where: { userId: sa.id } });
    console.log(`\n=== PEOPLE do SuperAdmin (${saPeople.length}) ===`);
    saPeople.forEach(p => console.log(`  ${p.name}`));

    const saProjects = await prisma.project.findMany({ where: { ownerId: sa.id } });
    console.log(`\n=== PROJECTS do SuperAdmin (${saProjects.length}) ===`);
    saProjects.forEach(p => console.log(`  ${p.name}`));

    // Check ALL people
    const allPeople = await prisma.person.findMany();
    console.log(`\n=== ALL PEOPLE (${allPeople.length}) ===`);
    allPeople.forEach(p => console.log(`  ${p.name} | userId: ${p.userId || 'NULL'}`));

    // Check ALL projects
    const allProjects = await prisma.project.findMany();
    console.log(`\n=== ALL PROJECTS (${allProjects.length}) ===`);
    allProjects.forEach(p => console.log(`  ${p.name} | ownerId: ${p.ownerId || 'NULL'}`));

    // Records with null userId in new columns
    const nullGoals = await prisma.goal.findMany({ where: { userId: null } });
    console.log(`\n=== NULL userId records ===`);
    console.log(`Goals: ${nullGoals.length}`);
    nullGoals.forEach(g => console.log(`  Goal: ${g.title}`));

    const nullTasks = await prisma.task.count({ where: { userId: null } });
    console.log(`Tasks: ${nullTasks}`);
    const nullEvents = await prisma.event.count({ where: { userId: null } });
    console.log(`Events: ${nullEvents}`);
    const nullFinances = await prisma.finance.count({ where: { userId: null } });
    console.log(`Finances: ${nullFinances}`);
    const nullStudies = await prisma.study.count({ where: { userId: null } });
    console.log(`Studies: ${nullStudies}`);
    const nullNotes = await prisma.note.count({ where: { userId: null } });
    console.log(`Notes: ${nullNotes}`);
    const nullLessons = await prisma.lesson.count({ where: { userId: null } });
    console.log(`Lessons: ${nullLessons}`);
    const nullFichamentos = await prisma.fichamento.count({ where: { userId: null } });
    console.log(`Fichamentos: ${nullFichamentos}`);
    const nullInteractions = await prisma.interaction.count({ where: { userId: null } });
    console.log(`Interactions: ${nullInteractions}`);
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); });
