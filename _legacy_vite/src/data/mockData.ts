import { Person, Objective, Project, Task, Study, Lesson, Finance, AgendaEvent } from '@/types';

// Mock data for development - will be replaced by Prisma + PostgreSQL

export const mockPeople: Person[] = [
  {
    id: '1',
    nome: 'Maria Clara',
    tipo: 'FILHO',
    contexto: 'FAMILIA',
    observacoes: 'Estudante do 5º ano',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    nome: 'João Pedro',
    tipo: 'FILHO',
    contexto: 'FAMILIA',
    observacoes: 'Estudante do 3º ano',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    nome: 'Carlos Silva',
    tipo: 'CLIENTE',
    contexto: 'EMPRESA',
    observacoes: 'Mentoria em liderança',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '4',
    nome: 'Ana Beatriz',
    tipo: 'COLABORADOR',
    contexto: 'EMPRESA',
    createdAt: new Date('2024-03-01'),
  },
];

export const mockObjectives: Objective[] = [
  {
    id: '1',
    titulo: 'Finalizar MBA em Gestão',
    areaDaVida: 'ESTUDO',
    prazo: new Date('2024-12-31'),
    metrica: 'Todas as disciplinas aprovadas',
    motivacao: 'Crescimento profissional e conhecimento avançado',
    status: 'EM_ANDAMENTO',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    titulo: 'Dobrar faturamento da empresa',
    areaDaVida: 'EMPRESA',
    prazo: new Date('2024-12-31'),
    metrica: 'R$ 500.000/ano',
    motivacao: 'Estabilidade financeira e crescimento',
    status: 'EM_ANDAMENTO',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    titulo: 'Melhorar qualidade de tempo com filhos',
    areaDaVida: 'FAMILIA',
    metrica: '2h de qualidade por dia',
    motivacao: 'Fortalecer vínculo familiar',
    status: 'EM_ANDAMENTO',
    createdAt: new Date('2024-02-01'),
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    nome: 'TCC do MBA',
    contexto: 'ESTUDO',
    objetivoId: '1',
    status: 'EM_ANDAMENTO',
    prazo: new Date('2024-11-30'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    nome: 'Lançamento Novo Produto',
    contexto: 'EMPRESA',
    objetivoId: '2',
    status: 'EM_ANDAMENTO',
    prazo: new Date('2024-06-30'),
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    nome: 'Férias em Família',
    contexto: 'FAMILIA',
    objetivoId: '3',
    status: 'PENDENTE',
    prazo: new Date('2024-07-15'),
    createdAt: new Date('2024-03-01'),
  },
  {
    id: '4',
    nome: 'Reestruturação Financeira Pessoal',
    contexto: 'PESSOAL',
    status: 'EM_ANDAMENTO',
    createdAt: new Date('2024-01-20'),
  },
];

export const mockTasks: Task[] = [
  {
    id: '1',
    titulo: 'Revisar capítulo 3 do TCC',
    projetoId: '1',
    contexto: 'ESTUDO',
    prioridade: 'ALTA',
    data: new Date(),
    recorrencia: 'NENHUMA',
    energia: 'ALTA',
    status: 'PENDENTE',
    createdAt: new Date(),
  },
  {
    id: '2',
    titulo: 'Reunião com equipe de marketing',
    projetoId: '2',
    contexto: 'EMPRESA',
    prioridade: 'ALTA',
    data: new Date(),
    recorrencia: 'NENHUMA',
    energia: 'MEDIA',
    status: 'PENDENTE',
    createdAt: new Date(),
  },
  {
    id: '3',
    titulo: 'Ajudar Maria Clara com dever de casa',
    contexto: 'FAMILIA',
    prioridade: 'MEDIA',
    data: new Date(),
    recorrencia: 'DIARIA',
    energia: 'BAIXA',
    status: 'PENDENTE',
    createdAt: new Date(),
  },
  {
    id: '4',
    titulo: 'Meditar 15 minutos',
    contexto: 'PESSOAL',
    prioridade: 'MEDIA',
    data: new Date(),
    recorrencia: 'DIARIA',
    energia: 'BAIXA',
    status: 'CONCLUIDO',
    createdAt: new Date(),
  },
  {
    id: '5',
    titulo: 'Enviar proposta para cliente',
    projetoId: '2',
    contexto: 'EMPRESA',
    prioridade: 'ALTA',
    data: new Date(Date.now() - 86400000), // yesterday
    recorrencia: 'NENHUMA',
    energia: 'MEDIA',
    status: 'PENDENTE',
    createdAt: new Date(),
  },
  {
    id: '6',
    titulo: 'Preparar material da aula de mentoria',
    contexto: 'EMPRESA',
    prioridade: 'MEDIA',
    data: new Date(Date.now() + 86400000), // tomorrow
    recorrencia: 'SEMANAL',
    energia: 'ALTA',
    status: 'PENDENTE',
    createdAt: new Date(),
  },
];

export const mockStudies: Study[] = [
  {
    id: '1',
    curso: 'MBA Gestão Empresarial',
    disciplina: 'Finanças Corporativas',
    tema: 'Análise de Investimentos',
    conteudo: 'VPL, TIR, Payback',
    anotacoes: '# Análise de Investimentos\n\n## VPL\nValor Presente Líquido é...',
    tempoDedicado: 120,
    status: 'CONCLUIDO',
    createdAt: new Date('2024-02-10'),
  },
  {
    id: '2',
    curso: 'MBA Gestão Empresarial',
    disciplina: 'Estratégia',
    tema: 'Planejamento Estratégico',
    tempoDedicado: 90,
    status: 'EM_ANDAMENTO',
    createdAt: new Date('2024-02-15'),
  },
];

export const mockLessons: Lesson[] = [
  {
    id: '1',
    clienteOuTurma: 'Carlos Silva',
    tema: 'Liderança Situacional',
    objetivo: 'Desenvolver habilidades de adaptação de estilo',
    conteudoAplicado: 'Modelo Hersey-Blanchard',
    materiais: 'Slides, exercícios práticos',
    followUp: 'Aplicar com equipe na próxima semana',
    createdAt: new Date('2024-02-20'),
  },
];

export const mockFinances: Finance[] = [
  {
    id: '1',
    descricao: 'Aluguel',
    categoria: 'PESSOAL',
    tipo: 'FIXO',
    valor: 2500,
    vencimento: new Date('2024-03-10'),
    status: 'PENDENTE',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    descricao: 'Escola Maria Clara',
    categoria: 'FILHO',
    tipo: 'FIXO',
    valor: 1800,
    vencimento: new Date('2024-03-15'),
    status: 'PENDENTE',
    pessoaId: '1',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    descricao: 'Software de gestão',
    categoria: 'EMPRESA',
    tipo: 'FIXO',
    valor: 300,
    vencimento: new Date('2024-03-05'),
    status: 'CONCLUIDO',
    createdAt: new Date('2024-01-01'),
  },
];

export const mockAgenda: AgendaEvent[] = [
  {
    id: '1',
    titulo: 'Aula MBA - Finanças',
    tipo: 'ESTUDO',
    dataInicio: new Date(),
    dataFim: new Date(Date.now() + 3600000 * 3),
    createdAt: new Date(),
  },
  {
    id: '2',
    titulo: 'Reunião de alinhamento',
    tipo: 'TRABALHO',
    dataInicio: new Date(Date.now() + 3600000 * 4),
    dataFim: new Date(Date.now() + 3600000 * 5),
    projetoId: '2',
    createdAt: new Date(),
  },
  {
    id: '3',
    titulo: 'Jantar em família',
    tipo: 'FAMILIA',
    dataInicio: new Date(Date.now() + 3600000 * 8),
    createdAt: new Date(),
  },
];
