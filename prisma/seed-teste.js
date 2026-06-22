/**
 * Seed script for "Teste" user (CPF: 12345678900)
 * Creates 2-3 demo records in EVERY module.
 * 
 * SAFETY: Only creates data linked to the Teste user. 
 *         Does NOT touch any other user's data.
 * 
 * Run: node prisma/seed-teste.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TESTE_DOCUMENT = '12345678900';

async function main() {
    // ─────────────────────────────────────────────
    // 1. FIND TESTE USER
    // ─────────────────────────────────────────────
    const user = await prisma.user.findUnique({
        where: { document: TESTE_DOCUMENT },
    });

    if (!user) {
        console.error('❌ Usuário Teste (CPF 12345678900) não encontrado no banco.');
        console.error('   Crie o usuário primeiro via interface ou seed-admin.js');
        return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id})`);

    // Check if demo data already exists
    const existingPeople = await prisma.person.count({ where: { userId: user.id } });
    if (existingPeople >= 3) {
        console.log('⚠️  Dados de demonstração já parecem existir. Deseja forçar? Apague manualmente antes.');
        console.log('   Continuando mesmo assim para preencher módulos faltantes...');
    }

    const userId = user.id;
    const now = new Date();

    // Helper: date offset from today
    const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);
    const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

    // ─────────────────────────────────────────────
    // 2. PESSOAS (3 registros)
    // ─────────────────────────────────────────────
    console.log('\n📋 Criando Pessoas...');

    const pessoa1 = await prisma.person.create({
        data: {
            name: 'Maria Silva',
            type: 'CLIENTE',
            context: 'EMPRESA',
            kind: 'FISICA',
            email: 'maria.silva@exemplo.com',
            phone: '(11) 98765-4321',
            mobile: '(11) 98765-4321',
            occupation: 'Gerente de Marketing',
            city: 'São Paulo',
            state: 'SP',
            notes: 'Cliente desde 2024. Interessada em consultoria estratégica.',
            stage: 'ATIVO',
            userId,
        },
    });

    const pessoa2 = await prisma.person.create({
        data: {
            name: 'João Santos',
            type: 'COLABORADOR',
            context: 'EMPRESA',
            kind: 'FISICA',
            email: 'joao.santos@exemplo.com',
            phone: '(21) 91234-5678',
            mobile: '(21) 91234-5678',
            occupation: 'Desenvolvedor Full Stack',
            city: 'Rio de Janeiro',
            state: 'RJ',
            notes: 'Colaborador sênior. Especialista em React e Node.js.',
            userId,
        },
    });

    const pessoa3 = await prisma.person.create({
        data: {
            name: 'Empresa TechSol Ltda',
            type: 'SOCIO',
            context: 'EMPRESA',
            kind: 'JURIDICA',
            email: 'contato@techsol.com.br',
            phone: '(11) 3456-7890',
            document: '12345678000190',
            fantasyName: 'TechSol Soluções',
            stateRegistration: '123.456.789.000',
            website: 'https://techsol.com.br',
            city: 'São Paulo',
            state: 'SP',
            street: 'Av. Paulista',
            number: '1000',
            district: 'Bela Vista',
            zipCode: '01310-100',
            notes: 'Parceiro estratégico para projetos de tecnologia.',
            userId,
        },
    });

    console.log(`   ✅ ${pessoa1.name}, ${pessoa2.name}, ${pessoa3.name}`);

    // ─────────────────────────────────────────────
    // 3. INTERAÇÕES (3 registros)
    // ─────────────────────────────────────────────
    console.log('\n💬 Criando Interações...');

    await prisma.interaction.createMany({
        data: [
            {
                personId: pessoa1.id,
                date: daysAgo(2),
                subject: 'Reunião de alinhamento do projeto',
                type: 'REUNIÃO',
                notes: 'Discutimos cronograma e prioridades para Q2. Maria aprovou a proposta.',
            },
            {
                personId: pessoa2.id,
                date: daysAgo(1),
                subject: 'Code review do módulo financeiro',
                type: 'LIGAÇÃO',
                notes: 'João apresentou melhorias na performance. Aprovado para merge.',
            },
            {
                personId: pessoa3.id,
                date: now,
                subject: 'Negociação de contrato 2025',
                type: 'EMAIL',
                notes: 'Enviamos proposta de renovação. Aguardando retorno até sexta.',
            },
        ],
    });
    console.log('   ✅ 3 interações criadas');

    // ─────────────────────────────────────────────
    // 4. METAS / GOALS (2 registros)
    // ─────────────────────────────────────────────
    console.log('\n🎯 Criando Metas...');

    const meta1 = await prisma.goal.create({
        data: {
            title: 'Aumentar faturamento em 30%',
            lifeArea: 'FINANCEIRO',
            deadline: daysFromNow(180),
            metric: 'Faturamento mensal de R$ 50k para R$ 65k',
            motivation: 'Expansão da empresa e contratação de novos colaboradores',
            status: 'IN_PROGRESS',
            progress: 35,
        },
    });

    const meta2 = await prisma.goal.create({
        data: {
            title: 'Concluir MBA em Gestão',
            lifeArea: 'ESTUDO',
            deadline: daysFromNow(365),
            metric: 'Conclusão de todos os 12 módulos',
            motivation: 'Capacitação profissional e crescimento na carreira',
            status: 'IN_PROGRESS',
            progress: 25,
        },
    });

    console.log(`   ✅ ${meta1.title}, ${meta2.title}`);

    // ─────────────────────────────────────────────
    // 5. PROJETOS (3 registros: Standard, Agile, linked to Goal)
    // ─────────────────────────────────────────────
    console.log('\n🏢 Criando Projetos...');

    const projeto1 = await prisma.project.create({
        data: {
            name: 'Redesign do Website',
            context: 'EMPRESA',
            type: 'STANDARD',
            status: 'IN_PROGRESS',
            deadline: daysFromNow(60),
            ownerId: userId,
            people: { connect: [{ id: pessoa1.id }, { id: pessoa2.id }] },
        },
    });

    const projeto2 = await prisma.project.create({
        data: {
            name: 'App Mobile SOPP',
            context: 'EMPRESA',
            type: 'AGILE',
            status: 'IN_PROGRESS',
            deadline: daysFromNow(120),
            ownerId: userId,
            people: { connect: [{ id: pessoa2.id }] },
        },
    });

    const projeto3 = await prisma.project.create({
        data: {
            name: 'Plano de Expansão Regional',
            context: 'EMPRESA',
            type: 'STANDARD',
            status: 'PENDING',
            deadline: daysFromNow(180),
            ownerId: userId,
            goalId: meta1.id,
            people: { connect: [{ id: pessoa3.id }] },
        },
    });

    console.log(`   ✅ ${projeto1.name}, ${projeto2.name}, ${projeto3.name}`);

    // ─────────────────────────────────────────────
    // 6. SPRINTS (2 no projeto ágil)
    // ─────────────────────────────────────────────
    console.log('\n🏃 Criando Sprints...');

    const sprint1 = await prisma.sprint.create({
        data: {
            name: 'Sprint 1: Fundação',
            startDate: daysAgo(14),
            endDate: now,
            status: 'COMPLETED',
            goal: 'Estrutura base do app, autenticação e navegação.',
            projectId: projeto2.id,
            retrospective: 'Entregamos todos os itens planejados. Velocidade: 21 pontos.',
        },
    });

    const sprint2 = await prisma.sprint.create({
        data: {
            name: 'Sprint 2: Features Core',
            startDate: now,
            endDate: daysFromNow(14),
            status: 'ACTIVE',
            goal: 'Dashboard principal, módulo financeiro e notificações push.',
            projectId: projeto2.id,
        },
    });

    console.log(`   ✅ ${sprint1.name}, ${sprint2.name}`);

    // ─────────────────────────────────────────────
    // 7. TASKS (3 tarefas)
    // ─────────────────────────────────────────────
    console.log('\n✅ Criando Tarefas...');

    await prisma.task.createMany({
        data: [
            {
                title: 'Criar wireframes do dashboard',
                context: 'EMPRESA',
                priority: 'High',
                status: 'COMPLETED',
                kanbanColumn: 'DONE',
                points: 5,
                projectId: projeto2.id,
                sprintId: sprint1.id,
                responsibleId: pessoa2.id,
                date: daysAgo(7),
                recurrenceType: 'NONE',
            },
            {
                title: 'Implementar módulo financeiro',
                context: 'EMPRESA',
                priority: 'High',
                status: 'IN_PROGRESS',
                kanbanColumn: 'DOING',
                points: 8,
                projectId: projeto2.id,
                sprintId: sprint2.id,
                responsibleId: pessoa2.id,
                date: daysFromNow(7),
                recurrenceType: 'NONE',
            },
            {
                title: 'Revisar contrato com TechSol',
                context: 'EMPRESA',
                priority: 'Medium',
                status: 'PENDING',
                kanbanColumn: 'TODO',
                points: 3,
                projectId: projeto3.id,
                responsibleId: pessoa1.id,
                date: daysFromNow(5),
                recurrenceType: 'NONE',
            },
        ],
    });
    console.log('   ✅ 3 tarefas criadas');

    // ─────────────────────────────────────────────
    // 8. OKRs (1 Objective + 3 Key Results)
    // ─────────────────────────────────────────────
    console.log('\n📊 Criando OKRs...');

    const objective = await prisma.objective.create({
        data: {
            title: 'Aumentar a base de clientes ativos',
            description: 'Expandir a carteira de clientes para gerar crescimento sustentável no próximo trimestre.',
            projectId: projeto1.id,
            keyResults: {
                create: [
                    {
                        title: 'Fechar 10 novos contratos',
                        description: 'Contratos de consultoria e serviços',
                        currentValue: 4,
                        targetValue: 10,
                        unit: 'contratos',
                    },
                    {
                        title: 'Atingir NPS de 90',
                        description: 'Satisfação medida por pesquisa mensal',
                        currentValue: 72,
                        targetValue: 90,
                        unit: 'pontos',
                    },
                    {
                        title: 'Reduzir churn para 5%',
                        description: 'Taxa de cancelamento mensal',
                        currentValue: 12,
                        targetValue: 5,
                        unit: '%',
                    },
                ],
            },
        },
    });
    console.log(`   ✅ Objetivo: ${objective.title} + 3 Key Results`);

    // ─────────────────────────────────────────────
    // 9. EVENTOS (3 registros)
    // ─────────────────────────────────────────────
    console.log('\n📅 Criando Eventos...');

    await prisma.event.createMany({
        data: [
            {
                title: 'Reunião de Planejamento Semanal',
                type: 'EMPRESA',
                startDate: daysFromNow(1),
                endDate: new Date(daysFromNow(1).getTime() + 3600000), // +1h
                projectId: projeto2.id,
                color: '#3B82F6',
                recurrenceType: 'WEEKLY',
                recurrenceEndDate: daysFromNow(90),
            },
            {
                title: 'Apresentação para Cliente - Maria',
                type: 'EMPRESA',
                startDate: daysFromNow(3),
                endDate: new Date(daysFromNow(3).getTime() + 5400000), // +1.5h
                projectId: projeto1.id,
                color: '#10B981',
                recurrenceType: 'NONE',
            },
            {
                title: 'Deadline: Entrega MVP do App',
                type: 'EMPRESA',
                startDate: daysFromNow(14),
                endDate: daysFromNow(14),
                projectId: projeto2.id,
                color: '#EF4444',
                recurrenceType: 'NONE',
            },
        ],
    });
    console.log('   ✅ 3 eventos criados');

    // ─────────────────────────────────────────────
    // 10. FINANÇAS (3 registros)
    // ─────────────────────────────────────────────
    console.log('\n💰 Criando Finanças...');

    await prisma.finance.createMany({
        data: [
            {
                description: 'Consultoria Estratégica - Maria Silva',
                category: 'RECEITA_SERVICO',
                type: 'VARIAVEL',
                amount: 8500.00,
                dueDate: daysFromNow(15),
                status: 'PENDING',
                personId: pessoa1.id,
                projectId: projeto1.id,
                recurrenceType: 'NONE',
            },
            {
                description: 'Aluguel do escritório',
                category: 'MORADIA',
                type: 'FIXO',
                amount: 3200.00,
                dueDate: daysFromNow(5),
                status: 'PENDING',
                recurrenceType: 'MONTHLY',
                recurrenceEndDate: daysFromNow(365),
            },
            {
                description: 'Venda de licença de software',
                category: 'RECEITA_VENDA',
                type: 'VARIAVEL',
                amount: 15000.00,
                dueDate: daysAgo(3),
                status: 'COMPLETED',
                personId: pessoa3.id,
                projectId: projeto2.id,
                recurrenceType: 'NONE',
            },
        ],
    });
    console.log('   ✅ 3 finanças criadas');

    // ─────────────────────────────────────────────
    // 11. ESTUDOS (3 registros)
    // ─────────────────────────────────────────────
    console.log('\n📚 Criando Estudos...');

    await prisma.study.createMany({
        data: [
            {
                course: 'MBA em Gestão Empresarial',
                subject: 'Finanças Corporativas',
                topic: 'Análise de Demonstrações Financeiras',
                content: 'Balanço patrimonial, DRE, fluxo de caixa. Indicadores: liquidez, endividamento, rentabilidade.',
                notes: 'Revisar exercícios do capítulo 5. Professor recomendou livro do Assaf Neto.',
                timeSpent: 120,
                status: 'COMPLETED',
            },
            {
                course: 'MBA em Gestão Empresarial',
                subject: 'Marketing Digital',
                topic: 'Funil de Vendas e Inbound Marketing',
                content: 'Conceitos de topo, meio e fundo de funil. Estratégias de conteúdo para cada etapa.',
                notes: 'Aplicar conceitos no projeto de expansão. Criar blog posts semanais.',
                timeSpent: 90,
                status: 'IN_PROGRESS',
            },
            {
                course: 'Curso de React Avançado',
                subject: 'Performance',
                topic: 'Server Components e Streaming SSR',
                content: 'React Server Components (RSC), Suspense boundaries, streaming SSR com Next.js App Router.',
                notes: 'Implementar RSC no projeto do App SOPP. Medir ganhos com Lighthouse.',
                timeSpent: 150,
                status: 'PENDING',
            },
        ],
    });
    console.log('   ✅ 3 estudos criados');

    // ─────────────────────────────────────────────
    // 12. LIVROS (2 registros)
    // ─────────────────────────────────────────────
    console.log('\n📖 Criando Livros...');

    const livro1 = await prisma.book.create({
        data: {
            title: 'O Poder do Hábito',
            author: 'Charles Duhigg',
            totalChapters: 12,
            currentChapter: 7,
            status: 'READING',
            userId,
        },
    });

    const livro2 = await prisma.book.create({
        data: {
            title: 'A Startup Enxuta',
            author: 'Eric Ries',
            totalChapters: 14,
            currentChapter: 14,
            status: 'COMPLETED',
            userId,
        },
    });

    console.log(`   ✅ ${livro1.title}, ${livro2.title}`);

    // ─────────────────────────────────────────────
    // 13. NOTAS (3 registros)
    // ─────────────────────────────────────────────
    console.log('\n📝 Criando Notas...');

    await prisma.note.createMany({
        data: [
            {
                title: 'Ideias para novo produto SaaS',
                theme: 'Inovação',
                content: '## Brainstorm\n\n- Plataforma de gestão para pequenas empresas\n- Integração com WhatsApp Business\n- Dashboard com IA para previsão de vendas\n- Módulo de CRM integrado\n\n## Próximos passos\n1. Validar com 5 potenciais clientes\n2. Criar protótipo no Figma\n3. Estimar custos de desenvolvimento',
                context: 'EMPRESA',
                type: 'TEXT',
            },
            {
                title: 'Resumo: Capítulo 7 - O Poder do Hábito',
                theme: 'Leitura',
                content: '## O Loop do Hábito\n\n**Deixa → Rotina → Recompensa**\n\nPara mudar um hábito, mantenha a deixa e a recompensa, mas altere a rotina.\n\n### Exemplo prático:\n- Deixa: Sentir cansaço às 15h\n- Rotina antiga: Comer doce\n- Rotina nova: Caminhar 10 min\n- Recompensa: Energia renovada',
                context: 'ESTUDO',
                type: 'TEXT',
                bookId: livro1.id,
            },
            {
                title: 'Plano de desenvolvimento pessoal 2025',
                theme: 'Planejamento',
                content: '## Objetivos do ano\n\n### Profissional\n- Concluir MBA ✅ (em andamento)\n- Certificação PMP\n- Lançar 2 novos produtos\n\n### Pessoal\n- Ler 24 livros\n- Exercício 4x/semana\n- Meditação diária\n\n### Financeiro\n- Investir 20% da renda\n- Reserva de emergência: 12 meses',
                context: 'PESSOAL',
                type: 'TEXT',
            },
        ],
    });
    console.log('   ✅ 3 notas criadas');

    // ─────────────────────────────────────────────
    // 14. FICHAMENTOS (2 registros)
    // ─────────────────────────────────────────────
    console.log('\n📑 Criando Fichamentos...');

    await prisma.fichamento.createMany({
        data: [
            {
                title: 'Citação: Poder do Hábito - Cap. 3',
                type: 'CITACAO',
                sourceType: 'LIVRO',
                authorLastName: 'Duhigg',
                authorFirstName: 'Charles',
                sourceTitle: 'O Poder do Hábito',
                year: 2012,
                edition: '1ª edição',
                city: 'Rio de Janeiro',
                publisher: 'Objetiva',
                pages: '87-92',
                keywords: 'hábito, mudança, neurociência, rotina',
                mainContent: '"Quando um hábito emerge, o cérebro para de participar totalmente da tomada de decisão. Ele para de trabalhar tanto ou desvia o foco para outras tarefas." (p. 89)',
                personalNote: 'Essa passagem explica por que é tão difícil quebrar hábitos antigos. A automação cerebral é poderosa.',
                bookId: livro1.id,
            },
            {
                title: 'Resumo: A Startup Enxuta - Conceitos Centrais',
                type: 'RESUMO',
                sourceType: 'LIVRO',
                authorLastName: 'Ries',
                authorFirstName: 'Eric',
                sourceTitle: 'A Startup Enxuta',
                year: 2011,
                edition: '1ª edição',
                city: 'São Paulo',
                publisher: 'Leya',
                pages: '1-280',
                keywords: 'lean startup, MVP, pivotar, build-measure-learn',
                mainContent: 'O método Lean Startup propõe: construir um MVP → medir resultados → aprender → iterar. O ciclo Build-Measure-Learn é o motor fundamental. Pivotar ou perseverar deve ser uma decisão baseada em dados, não em intuição.',
                personalNote: 'Aplicar o conceito de MVP no projeto de expansão regional. Começar pequeno, validar hipóteses antes de investir pesado.',
                bookId: livro2.id,
            },
        ],
    });
    console.log('   ✅ 2 fichamentos criados');

    // ─────────────────────────────────────────────
    // 15. AULAS / LESSONS (2 registros)
    // ─────────────────────────────────────────────
    console.log('\n🎓 Criando Aulas...');

    await prisma.lesson.createMany({
        data: [
            {
                clientOrGroup: 'Maria Silva - Consultoria Individual',
                topic: 'Planejamento Estratégico para Q2',
                objective: 'Definir metas trimestrais e KPIs de acompanhamento',
                appliedContent: 'Framework OKR, análise SWOT, canvas de proposta de valor',
                materials: 'Slides, template OKR, planilha de metas',
                followUp: 'Maria vai enviar draft de OKRs até sexta. Agendar próxima sessão em 15 dias.',
                personId: pessoa1.id,
                date: daysAgo(5),
                rating: 5,
                studentFeedback: 'Excelente! Muito prático e aplicável.',
            },
            {
                clientOrGroup: 'Equipe TechSol - Treinamento',
                topic: 'Clean Code e Boas Práticas',
                objective: 'Elevar a qualidade do código da equipe',
                appliedContent: 'Princípios SOLID, naming conventions, refactoring patterns',
                materials: 'Repositório de exemplos, exercícios práticos',
                followUp: 'Equipe vai aplicar princípios no próximo sprint. Review em 2 semanas.',
                personId: pessoa2.id,
                date: daysAgo(2),
                rating: 4,
                studentFeedback: 'Muito bom! Pedir mais exercícios práticos na próxima.',
            },
        ],
    });
    console.log('   ✅ 2 aulas criadas');

    // ─────────────────────────────────────────────
    // 16. ORAÇÕES (3 registros)
    // ─────────────────────────────────────────────
    console.log('\n🙏 Criando Orações...');

    await prisma.prayer.createMany({
        data: [
            {
                title: 'Sabedoria para decisões profissionais',
                description: 'Peço sabedoria e discernimento para tomar boas decisões na empresa, especialmente sobre a expansão regional e novas contratações.',
                category: 'Profissional',
                status: 'IN_PROGRESS',
                userId,
            },
            {
                title: 'Proteção e saúde da família',
                description: 'Agradeço pela saúde e peço proteção para toda a família. Que tenhamos paz e união.',
                category: 'Família',
                status: 'IN_PROGRESS',
                userId,
            },
            {
                title: 'Gratidão por conquista do mês',
                description: 'Agradeço pelo fechamento do contrato com TechSol. Foi uma resposta clara de oração.',
                category: 'Gratidão',
                status: 'COMPLETED',
                userId,
            },
        ],
    });
    console.log('   ✅ 3 orações criadas');

    // ─────────────────────────────────────────────
    // 17. PLANO BÍBLICO + USER PLAN
    // ─────────────────────────────────────────────
    console.log('\n📖 Criando Plano de Leitura Bíblica...');

    const planoBiblico = await prisma.bibleReadingPlan.create({
        data: {
            title: 'Provérbios em 31 Dias',
            description: 'Um capítulo de Provérbios por dia, ideal para sabedoria prática.',
            type: 'TEMATICO',
            totalDays: 31,
            readings: {
                create: Array.from({ length: 31 }, (_, i) => ({
                    day: i + 1,
                    reference: `Provérbios ${i + 1}`,
                    books: 'PRO',
                    chapters: `${i + 1}`,
                })),
            },
        },
    });

    await prisma.userBiblePlan.create({
        data: {
            userId,
            planId: planoBiblico.id,
            currentDay: 12,
            progress: (11 / 31) * 100,
            status: 'IN_PROGRESS',
        },
    });

    console.log(`   ✅ Plano: ${planoBiblico.title} (dia 12/31)`);

    // ─────────────────────────────────────────────
    // RESUMO FINAL
    // ─────────────────────────────────────────────
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 SEED COMPLETO - Dados criados para o usuário Teste:');
    console.log('═'.repeat(50));
    console.log('   👥 3 Pessoas (Cliente, Colaborador, Sócio PJ)');
    console.log('   💬 3 Interações');
    console.log('   🎯 2 Metas');
    console.log('   🏢 3 Projetos (Standard + Ágil + c/ Meta)');
    console.log('   🏃 2 Sprints');
    console.log('   ✅ 3 Tarefas (Kanban: TODO, DOING, DONE)');
    console.log('   📊 1 OKR (1 Objetivo + 3 Key Results)');
    console.log('   📅 3 Eventos');
    console.log('   💰 3 Finanças (receitas + despesa)');
    console.log('   📚 3 Estudos');
    console.log('   📖 2 Livros');
    console.log('   📝 3 Notas');
    console.log('   📑 2 Fichamentos');
    console.log('   🎓 2 Aulas');
    console.log('   🙏 3 Orações');
    console.log('   📖 1 Plano Bíblico (Provérbios 31 dias)');
    console.log('═'.repeat(50));
    console.log('Total: 37 registros em 16 módulos');
    console.log('⚠️  Todos vinculados EXCLUSIVAMENTE ao usuário Teste.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Erro durante o seed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
