const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const latest = await prisma.study.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  if (latest) {
    console.log("=== ÚLTIMO ESTUDO SALVO ===");
    console.log("ID:", latest.id);
    console.log("Tópico:", latest.topic);
    console.log("Tamanho de Notes:", latest.notes ? latest.notes.length : "vazio");
    if (latest.notes) {
      const containsImage = latest.notes.includes("<img");
      const containsBase64 = latest.notes.includes("data:image");
      console.log("Contém tag <img>:", containsImage);
      console.log("Contém Base64:", containsBase64);
      if (containsImage) {
         console.log("\n--- Trecho de Notes ---");
         console.log(latest.notes.substring(0, 500));
      }
    } else {
      console.log("Notes está nulo ou vazio.");
    }
  } else {
    console.log("Nenhum estudo encontrado.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
