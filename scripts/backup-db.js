const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `db_snapshot_${timestamp}.json`);

  console.log(`Starting backup to ${backupFile}...`);

  // Use DMMF to get all model names dynamically
  const models = Object.keys(prisma).filter(key => 
    !key.startsWith('_') && !key.startsWith('$')
  );

  const snapshot = {};

  for (const model of models) {
    try {
      console.log(`Backing up model: ${model}...`);
      const data = await prisma[model].findMany();
      snapshot[model] = data;
    } catch (error) {
      console.error(`Error backing up model ${model}:`, error.message);
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2));
  console.log(`Backup completed successfully! Created ${backupFile}`);
}

backup()
  .catch(e => {
    console.error('Backup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
