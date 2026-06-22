import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration...');

  const mapping = {
    EMPRESA: 'REALIZACAO',
    ESTUDO: 'INTELECTUAL',
    PESSOAL: 'SAUDE',
  };

  const tables = ['person', 'project', 'task', 'event', 'note'];

  for (const [oldValue, newValue] of Object.entries(mapping)) {
    console.log(`Migrating ${oldValue} to ${newValue}...`);
    
    // Update Person
    const personCount = await (prisma.person as any).updateMany({
      where: { context: oldValue },
      data: { context: newValue },
    });
    console.log(`Updated ${personCount.count} Persons`);

    // Update Project
    const projectCount = await (prisma.project as any).updateMany({
      where: { context: oldValue },
      data: { context: newValue },
    });
    console.log(`Updated ${projectCount.count} Projects`);

    // Update Task
    const taskCount = await (prisma.task as any).updateMany({
      where: { context: oldValue },
      data: { context: newValue },
    });
    console.log(`Updated ${taskCount.count} Tasks`);

    // Update Event
    const eventCount = await (prisma.event as any).updateMany({
      where: { type: oldValue }, // Event uses 'type' for Context
      data: { type: newValue },
    });
    console.log(`Updated ${eventCount.count} Events`);

    // Update Note
    const noteCount = await (prisma.note as any).updateMany({
      where: { context: oldValue },
      data: { context: newValue },
    });
    console.log(`Updated ${noteCount.count} Notes`);
  }

  console.log('Data migration completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
