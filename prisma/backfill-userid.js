/**
 * Backfill script: assigns userId to all existing records that lack it.
 * 
 * STRATEGY:
 * - Records linked to Person(userId=X) → assign userId=X
 * - Records linked to Project(ownerId=X) → assign userId=X  
 * - Records linked to Book(userId=X) → assign userId=X
 * - Orphan records (no relation to trace) → assign to SuperAdmin
 * - Records created by seed-teste.js → already linked via Person/Project of Teste user
 * 
 * SAFETY: This script only updates records WHERE userId IS NULL.
 *         It will NOT overwrite any existing userId assignments.
 * 
 * Run: node prisma/backfill-userid.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SUPERADMIN_DOC = '31020403810';
const TESTE_DOC = '12345678900';

async function main() {
    // Get users
    const superAdmin = await prisma.user.findUnique({ where: { document: SUPERADMIN_DOC } });
    const testeUser = await prisma.user.findUnique({ where: { document: TESTE_DOC } });

    if (!superAdmin) {
        console.error('❌ SuperAdmin not found');
        return;
    }

    console.log(`✅ SuperAdmin: ${superAdmin.name} (${superAdmin.id})`);
    if (testeUser) console.log(`✅ Teste user: ${testeUser.name} (${testeUser.id})`);

    // ─── 1. GOALS (orphan - no direct user link) ───
    console.log('\n🎯 Backfilling Goals...');
    // Goals linked to projects with an owner
    const goals = await prisma.goal.findMany({
        where: { userId: null },
        include: { projects: { select: { ownerId: true } } }
    });
    for (const goal of goals) {
        const ownerId = goal.projects.find(p => p.ownerId)?.ownerId || superAdmin.id;
        await prisma.goal.update({ where: { id: goal.id }, data: { userId: ownerId } });
    }
    console.log(`   ✅ ${goals.length} goals updated`);

    // ─── 2. TASKS ───
    console.log('\n✅ Backfilling Tasks...');
    // Tasks linked to projects → use project ownerId
    const tasks = await prisma.task.findMany({
        where: { userId: null },
        include: { project: { select: { ownerId: true } } }
    });
    for (const task of tasks) {
        const ownerId = task.project?.ownerId || superAdmin.id;
        await prisma.task.update({ where: { id: task.id }, data: { userId: ownerId } });
    }
    console.log(`   ✅ ${tasks.length} tasks updated`);

    // ─── 3. EVENTS ───
    console.log('\n📅 Backfilling Events...');
    const events = await prisma.event.findMany({
        where: { userId: null },
        include: { project: { select: { ownerId: true } } }
    });
    for (const ev of events) {
        const ownerId = ev.project?.ownerId || superAdmin.id;
        await prisma.event.update({ where: { id: ev.id }, data: { userId: ownerId } });
    }
    console.log(`   ✅ ${events.length} events updated`);

    // ─── 4. FINANCES ───
    console.log('\n💰 Backfilling Finances...');
    const finances = await prisma.finance.findMany({
        where: { userId: null },
        include: {
            project: { select: { ownerId: true } },
            person: { select: { userId: true } }
        }
    });
    for (const fin of finances) {
        const ownerId = fin.project?.ownerId || fin.person?.userId || superAdmin.id;
        await prisma.finance.update({ where: { id: fin.id }, data: { userId: ownerId } });
    }
    console.log(`   ✅ ${finances.length} finances updated`);

    // ─── 5. NOTES ───
    console.log('\n📝 Backfilling Notes...');
    const notes = await prisma.note.findMany({
        where: { userId: null },
        include: { book: { select: { userId: true } } }
    });
    for (const note of notes) {
        const ownerId = note.book?.userId || superAdmin.id;
        await prisma.note.update({ where: { id: note.id }, data: { userId: ownerId } });
    }
    console.log(`   ✅ ${notes.length} notes updated`);

    // ─── 6. STUDIES (orphan) ───
    console.log('\n📚 Backfilling Studies...');
    // Studies have no direct relation. We'll check if they were created 
    // after the teste seed (by checking createdAt proximity to now)
    const studies = await prisma.study.findMany({ where: { userId: null } });
    
    // Get the Teste user's people to check if any study was created around the same time
    if (testeUser) {
        const testePeople = await prisma.person.findMany({ 
            where: { userId: testeUser.id },
            select: { createdAt: true }
        });
        const testeCreatedAt = testePeople[0]?.createdAt;
        
        for (const study of studies) {
            // If created within 5 minutes of teste people → belongs to Teste
            const timeDiff = testeCreatedAt ? 
                Math.abs(study.createdAt.getTime() - testeCreatedAt.getTime()) : Infinity;
            const ownerId = timeDiff < 300000 ? testeUser.id : superAdmin.id;
            await prisma.study.update({ where: { id: study.id }, data: { userId: ownerId } });
        }
    } else {
        for (const study of studies) {
            await prisma.study.update({ where: { id: study.id }, data: { userId: superAdmin.id } });
        }
    }
    console.log(`   ✅ ${studies.length} studies updated`);

    // ─── 7. LESSONS ───
    console.log('\n🎓 Backfilling Lessons...');
    const lessons = await prisma.lesson.findMany({
        where: { userId: null },
        include: { person: { select: { userId: true } } }
    });
    for (const lesson of lessons) {
        const ownerId = lesson.person?.userId || superAdmin.id;
        await prisma.lesson.update({ where: { id: lesson.id }, data: { userId: ownerId } });
    }
    console.log(`   ✅ ${lessons.length} lessons updated`);

    // ─── 8. FICHAMENTOS ───
    console.log('\n📑 Backfilling Fichamentos...');
    const fichamentos = await prisma.fichamento.findMany({
        where: { userId: null },
        include: { book: { select: { userId: true } } }
    });
    for (const f of fichamentos) {
        const ownerId = f.book?.userId || superAdmin.id;
        await prisma.fichamento.update({ where: { id: f.id }, data: { userId: ownerId } });
    }
    console.log(`   ✅ ${fichamentos.length} fichamentos updated`);

    // ─── 9. INTERACTIONS ───
    console.log('\n💬 Backfilling Interactions...');
    const interactions = await prisma.interaction.findMany({
        where: { userId: null },
        include: { person: { select: { userId: true } } }
    });
    for (const i of interactions) {
        const ownerId = i.person?.userId || superAdmin.id;
        await prisma.interaction.update({ where: { id: i.id }, data: { userId: ownerId } });
    }
    console.log(`   ✅ ${interactions.length} interactions updated`);

    // ─── SUMMARY ───
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 BACKFILL COMPLETO');
    console.log('═'.repeat(50));
    
    // Verification counts
    if (testeUser) {
        const counts = await Promise.all([
            prisma.goal.count({ where: { userId: testeUser.id } }),
            prisma.task.count({ where: { userId: testeUser.id } }),
            prisma.event.count({ where: { userId: testeUser.id } }),
            prisma.finance.count({ where: { userId: testeUser.id } }),
            prisma.note.count({ where: { userId: testeUser.id } }),
            prisma.study.count({ where: { userId: testeUser.id } }),
            prisma.lesson.count({ where: { userId: testeUser.id } }),
            prisma.fichamento.count({ where: { userId: testeUser.id } }),
            prisma.interaction.count({ where: { userId: testeUser.id } }),
        ]);
        console.log(`\nDados do Teste: Goals=${counts[0]}, Tasks=${counts[1]}, Events=${counts[2]}, Finances=${counts[3]}, Notes=${counts[4]}, Studies=${counts[5]}, Lessons=${counts[6]}, Fichamentos=${counts[7]}, Interactions=${counts[8]}`);
    }

    const nullCounts = await Promise.all([
        prisma.goal.count({ where: { userId: null } }),
        prisma.task.count({ where: { userId: null } }),
        prisma.event.count({ where: { userId: null } }),
        prisma.finance.count({ where: { userId: null } }),
        prisma.note.count({ where: { userId: null } }),
        prisma.study.count({ where: { userId: null } }),
        prisma.lesson.count({ where: { userId: null } }),
        prisma.fichamento.count({ where: { userId: null } }),
        prisma.interaction.count({ where: { userId: null } }),
    ]);
    
    const totalNull = nullCounts.reduce((a, b) => a + b, 0);
    console.log(`\n⚠️  Records still without userId: ${totalNull}`);
    if (totalNull === 0) {
        console.log('✅ All records have been assigned a userId!');
    }
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error('❌ Error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
