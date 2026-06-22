const { execSync } = require('child_process');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || '';
const isRemote = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');

const command = process.argv[2];

if (isRemote && command === 'migrate dev') {
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Attempting to run "migrate dev" on a remote database!');
    console.error('\x1b[33m%s\x1b[0m', 'Remote URL detected: ' + dbUrl.split('@')[1]);
    console.error('\x1b[33m%s\x1b[0m', 'Use "npm run db:deploy" for remote environments to avoid data loss.');
    process.exit(1);
}

try {
    execSync(`npx prisma ${command}`, { stdio: 'inherit' });
} catch (e) {
    process.exit(1);
}
