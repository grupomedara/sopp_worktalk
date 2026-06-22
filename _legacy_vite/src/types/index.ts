// Type definitions for SOPP - Ready for Prisma migration

export type PersonType = 'FILHO' | 'CLIENTE' | 'COLABORADOR' | 'SOCIO';
export type Context = 'FAMILIA' | 'EMPRESA' | 'PESSOAL' | 'ESTUDO';
export type Priority = 'ALTA' | 'MEDIA' | 'BAIXA';
export type Energy = 'ALTA' | 'MEDIA' | 'BAIXA';
export type Status = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
export type FinanceType = 'FIXO' | 'VARIAVEL';
export type FinanceCategory = 'PESSOAL' | 'EMPRESA' | 'FILHO';
export type AgendaType = 'TRABALHO' | 'ESTUDO' | 'FAMILIA' | 'ESPIRITUAL';
export type Recurrence = 'NENHUMA' | 'DIARIA' | 'SEMANAL' | 'MENSAL';

export interface Person {
  id: string;
  nome: string;
  tipo: PersonType;
  contexto: Context;
  observacoes?: string;
  createdAt: Date;
}

export interface Objective {
  id: string;
  titulo: string;
  areaDaVida: Context;
  prazo?: Date;
  metrica?: string;
  motivacao?: string;
  status: Status;
  createdAt: Date;
}

export interface Project {
  id: string;
  nome: string;
  contexto: Context;
  objetivoId?: string;
  objetivo?: Objective;
  status: Status;
  prazo?: Date;
  createdAt: Date;
}

export interface Task {
  id: string;
  titulo: string;
  projetoId?: string;
  projeto?: Project;
  contexto: Context;
  prioridade: Priority;
  data?: Date;
  recorrencia: Recurrence;
  energia: Energy;
  status: Status;
  createdAt: Date;
}

export interface Study {
  id: string;
  curso: string;
  disciplina?: string;
  tema: string;
  conteudo?: string;
  anotacoes?: string;
  tempoDedicado?: number; // in minutes
  status: Status;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  clienteOuTurma: string;
  tema: string;
  objetivo?: string;
  conteudoAplicado?: string;
  materiais?: string;
  followUp?: string;
  createdAt: Date;
}

export interface Finance {
  id: string;
  descricao: string;
  categoria: FinanceCategory;
  tipo: FinanceType;
  valor: number;
  vencimento?: Date;
  status: Status;
  pessoaId?: string;
  pessoa?: Person;
  projetoId?: string;
  projeto?: Project;
  createdAt: Date;
}

export interface AgendaEvent {
  id: string;
  titulo: string;
  tipo: AgendaType;
  dataInicio: Date;
  dataFim?: Date;
  projetoId?: string;
  projeto?: Project;
  createdAt: Date;
}

// Dashboard types
export interface DashboardStats {
  tasksToday: number;
  tasksOverdue: number;
  objectivesInProgress: number;
  studyHoursWeek: number;
}

export interface ContextColors {
  FAMILIA: string;
  EMPRESA: string;
  PESSOAL: string;
  ESTUDO: string;
}
