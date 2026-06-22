const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restore() {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error('Please specify the backup file path: node scripts/restore-db.js backups/db_snapshot_xxx.json');
    process.exit(1);
  }

  if (!fs.existsSync(backupFile)) {
    console.error(`Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  const models = Object.keys(snapshot);

  console.log(`Starting restore from ${backupFile}...`);
  console.log('IMPORTANT: This will overwrite data in current tables.');

  // Disable constraints if possible or just delete in order
  // For simplicity, we'll try to delete and then create
  // Note: Handling relations requires specific order (Children first, then parents)
  
  // Custom delete order to handle foreign key constraints
  const deleteOrder = [
    'UserBiblePlan', 'UserCourse', 'ActivityLog', 'Notification', 
    'Lesson', 'Finance', 'Event', 'Task', 
    'Sprint', 'Project', 'Person', 'Goal', 'Study', 'Book', 'BiblePlan', 'Course', 'User'
  ];

  for (const model of deleteOrder) {
    if (prisma[model]) {
      try {
        console.log(`Clearing table: ${model}...`);
        await prisma[model].deleteMany();
      } catch (e) {
        console.warn(`Warning clearing ${model}: ${e.message}`);
      }
    }
  }

  // Restore order (Parents first, then children)
  const restoreOrder = [...deleteOrder].reverse();

  for (const model of restoreOrder) {
    const data = snapshot[model];
    if (data && data.length > 0) {
      console.log(`Restoring table: ${model} (${data.length} records)...`);
      try {
        // We use createMany or multiple creates to handle specific ID requirements
        for (const item of data) {
           await prisma[model].create({ data: item });
        }
      } catch (error) {
        console.error(`Error restoring model ${model}:`, error.message);
      }
    }
  }

  console.log('Restore completed successfully!');
}

restore()
  .catch(e => {
    console.error('Restore failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
