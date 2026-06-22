import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.pushSubscription.findMany({});
  console.log("DATABASE PUSH SUBSCRIPTIONS:");
  console.dir(subs, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
