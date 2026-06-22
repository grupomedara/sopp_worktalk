
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const document = '31020403810'; // Super Admin CPF (normalized)

    const user = await prisma.user.findUnique({
        where: { document }
    });

    if (!user) {
        console.log("User not found via seed-data.js. Run seed-admin.js first.");
        return;
    }

    // Check if project already exists to avoid duplicates
    const existingProject = await prisma.project.findFirst({
        where: { ownerId: user.id, type: 'AGILE' }
    });

    if (existingProject) {
        console.log("Initial project already exists.");
        return;
    }

    // Create initial Agile Project with Sprints and Tasks
    const project = await prisma.project.create({
        data: {
            name: "Implantação Ágil",
            context: "EMPRESA", // Enum Context
            type: "AGILE",
            status: "IN_PROGRESS", // Enum Status
            ownerId: user.id,
            // Nested Sprints
            sprints: {
                create: {
                    name: "Sprint 1: Setup",
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 14)),
                    status: "ACTIVE",
                    goal: "Configurar ambiente e primeiros acessos.",
                    tasks: {
                        create: [
                            {
                                title: "Configurar Perfil",
                                context: "EMPRESA",
                                priority: "High",
                                status: "PENDING",
                                kanbanColumn: "TODO",
                                points: 3,
                                recurrenceType: "NONE" // Required by schema default
                            },
                            {
                                title: "Criar Primeiros Usuários",
                                context: "EMPRESA",
                                priority: "Medium",
                                status: "PENDING",
                                kanbanColumn: "TODO",
                                points: 5,
                                recurrenceType: "NONE"
                            }
                        ]
                    }
                }
            }
        }
    });

    console.log("Seeded Project:", project.name);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
