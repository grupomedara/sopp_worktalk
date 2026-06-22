# Plano de Implementação: Rotinas e Checklists de Pessoas & Funções (SOP) - Versão 5 (Pivot)

Com base no seu excelente feedback, readequamos a arquitetura do sistema para alinhar perfeitamente com a visão prática de gestão de equipe: **o checklist é baseado na Pessoa ou Função, e cada tarefa individual dentro dele possui sua própria recorrência.**

---

## 🎯 Nova Visão Arquitetural: Checklists de Pessoas/Funções com Tarefas de Recorrências Múltiplas

### 1. Checklists Baseados em Pessoas ou Funções
- Um **Checklist (Routine)** passa a ser um agrupador corporativo (Ex: "Checklist do Vendedor", "Checklist do João", "Checklist Operacional de TI").
- Ele conterá um **título obrigatório**, uma **Função/Cargo (role)** opcional em formato de texto e um **Responsável (Person)** opcional.
- Você pode criar checklists ilimitados para qualquer pessoa ou função.

### 2. Recorrências no Nível do Item (Tarefas)
- A frequência e regras de dias (`frequency` e `scheduleDays`) serão movidas da tabela `Routine` para a tabela **`RoutineItem`** (as tarefas individuais).
- Isso permite que dentro do *"Checklist do João"*, você possa cadastrar:
  - 10 tarefas **Diárias** (Ex: "Abrir servidor", "Responder e-mails").
  - 5 tarefas **Semanais** (Ex: "Fazer backup na sexta", "Limpar mesa").
  - 2 tarefas **Mensais** (Ex: "Fechar relatório todo dia 30").
  - Outras periódicas (Bimestrais, Trimestrais, Esporádicas).

### 3. Execução Diária Dinâmica
- Quando você (ou o João) abrir o aplicativo no dia de hoje, o sistema listará o *"Checklist do João"*.
- O checklist exibirá **apenas os itens que estão ativos para o dia de hoje** com base em suas frequências individuais!
  - Se for Segunda-feira: exibe as 10 tarefas diárias + tarefas semanais ativas na segunda-feira.
  - Se for Sexta-feira: exibe as 10 tarefas diárias + tarefas semanais ativas na sexta-feira.
- O cálculo de progresso (%) será dinâmico, baseado **apenas nas tarefas ativas para aquela data específica** (Ex: "Concluído 2 de 12 tarefas de hoje - 16%").

---

## 🛠️ Nova Modelagem de Dados (Prisma Schema)

```prisma
model Routine {
  id              String             @id @default(uuid())
  title           String             // Título obrigatório (Ex: "Checklist do João")
  role            String?            // Função/Cargo opcional (Ex: "Vendedor", "Suporte")
  description     String?
  isActive        Boolean            @default(true)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  userId          String             // Gestor / Criador
  responsibleId   String?            // Funcionário responsável (opcional - Person)
  projectId       String?            // Projeto vinculado (opcional)
  
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  responsible     Person?            @relation(fields: [responsibleId], references: [id], onDelete: SetNull)
  project         Project?           @relation(fields: [projectId], references: [id], onDelete: SetNull)
  items           RoutineItem[]
  executions      RoutineExecution[]

  @@index([userId])
  @@index([responsibleId])
  @@index([projectId])
}

model RoutineItem {
  id          String             @id @default(uuid())
  routineId   String
  title       String             // Título da tarefa individual
  description String?
  frequency   RoutineFrequency   // DAILY, WEEKLY, BIWEEKLY, MONTHLY, BIMONTHLY, QUARTERLY, SEMESTERLY, SPORADIC
  scheduleDays String?            // Regras de recorrência em formato JSON string
  order       Int                @default(0)
  timeOfDay   String?            // Horário sugerido: "08:00"
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  
  routine     Routine            @relation(fields: [routineId], references: [id], onDelete: Cascade)
  itemLogs    RoutineItemLog[]

  @@index([routineId])
}

model RoutineExecution {
  id          String           @id @default(uuid())
  routineId   String
  userId      String
  date        String           // Formato "YYYY-MM-DD"
  completedAt DateTime?
  notes       String?          
  
  routine     Routine          @relation(fields: [routineId], references: [id], onDelete: Cascade)
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemLogs    RoutineItemLog[]

  @@unique([routineId, date])
  @@index([userId])
}

model RoutineItemLog {
  id          String           @id @default(uuid())
  executionId String
  itemId      String
  completed   Boolean          @default(false)
  completedAt DateTime?
  note        String?          
  
  execution   RoutineExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  item        RoutineItem      @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([executionId, itemId])
}

enum RoutineFrequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  BIMONTHLY
  QUARTERLY
  SEMESTERLY
  SPORADIC
}
```

---

## 📋 Plano de Refatoração

### Passo 1: Migração Prisma
- Modificar o `prisma/schema.prisma` para mover `frequency` e `scheduleDays` de `Routine` para `RoutineItem`.
- Adicionar `role` string opcional em `Routine`.
- Rodar a migração segura no banco (`npx prisma db push`).

### Passo 2: Refatorar Server Actions (`src/app/actions/routines.ts`)
- Atualizar `createRoutine` e `updateRoutine` para remover campos de frequência e adicionar `role`.
- Atualizar `createRoutineItem` e `updateRoutineItem` para incluir `frequency` e `scheduleDays` na criação das tarefas.
- Refatorar a filtragem em `getTodayRoutines(dateStr)` para que a verificação de `isRoutineActiveOnDate` seja aplicada **dentro dos itens** do checklist, excluindo da resposta os itens inativos no dia.

### Passo 3: Refatorar UI de Formulários (`RoutinesDashboard.tsx`)
- Mover a seção de configuração de recorrência do modal de "Criar Rotina" para o modal de "Criar Passo/Tarefa".
- Adicionar campo opcional de Função/Cargo no modal de criação da rotina.
- Garantir que o cálculo de progresso e exibição continue dinâmico.

### Passo 4: Atualizar Widget do Dashboard Geral
- Atualizar métricas para refletir a nova lógica baseada no progresso dos itens ativos hoje.
