# Plano de Implementação: Módulo de Registro de Reuniões (Atas)

Este plano descreve o design e as etapas para implementar o módulo de reuniões e atas no sistema SOPP, seguindo as diretrizes estruturais semelhantes ao módulo de Estudos, porém especializado para encontros, temas, vinculação de participantes, horários e geração automática de duração no frontend.

---

## 🏗️ Tipo de Projeto
- **WEB** (Next.js App Router + Prisma + PostgreSQL)

---

## 🎯 Critérios de Sucesso
1. **Banco de Dados:** Criação do modelo `Meeting` e relação muitos-para-muitos com `Person` no banco de dados via Prisma.
2. **Formulário de Criação/Edição:**
   - Preenchimento em formato de texto livre para **Empresa/Pessoa** e **Tema** com lista suspensa (autocompletar) baseada nos registros existentes.
   - Seleção de múltiplos participantes registrados (tabela `Person`) via componente `MultiSelect`.
   - Campos de Data, Horário de Início e Horário de Término.
   - Cálculo automático da **duração** no frontend exibido em tempo real.
   - Editor de ata rico (Rich-Text Editor Notion-like, igual ao módulo de Notas/Estudos).
   - Auto-save integrado para o formulário de edição (se houver correspondência com o padrão do sistema).
3. **Painel e Listagem:**
   - Exibição de métricas (número de reuniões, tempo total).
   - Filtros dinâmicos por Empresa/Pessoa, Tema, e intervalo de datas.
   - Tabela de listagem ordenada por data/hora mais recente com suporte à deleção e edição.
4. **Navegação:** Inclusão do link "Reuniões" no submenu "Conhecimento" da Sidebar.

---

## 🛠️ Stack Tecnológica
- **Backend/ORM:** Prisma ORM, PostgreSQL, Server Actions do Next.js.
- **Frontend/Componentes:** React 18, Tailwind CSS, shadcn/ui, Lucide React (Ícones).
- **Validação & Formulários:** React Hook Form, Zod Resolver, Zod.
- **Manipulação de Tempo:** `date-fns` para tratamento de datas e diferenças.

---

## 📁 Estrutura de Arquivos Proposta

```plaintext
prisma/
 └── schema.prisma                              # [Modificar] Adicionar modelo Meeting e atualizar Person
src/
 ├── app/
 │    ├── (main)/
 │    │    └── meetings/
 │    │         └── page.tsx                    # [Novo] Página principal de Reuniões (Server Component)
 │    └── actions/
 │         └── meetings.ts                      # [Novo] Server Actions (getMeetings, create, update, delete)
 └── components/
      ├── layout/
      │    └── Sidebar.tsx                      # [Modificar] Adicionar link "Reuniões" na Sidebar
      └── meetings/                             # [Novo Diretório]
           ├── MeetingDialog.tsx                # [Novo] Diálogo de abertura do formulário
           ├── MeetingFilters.tsx               # [Novo] Filtros de pesquisa
           ├── MeetingForm.tsx                  # [Novo] Formulário com CreatableCombobox, MultiSelect e RichTextEditor
           ├── MeetingMetrics.tsx               # [Novo] Cards de métricas rápidas (Total de reuniões, Horas acumuladas)
           └── MeetingTable.tsx                 # [Novo] Tabela de listagem e ações
```

---

## 📝 Detalhamento do Schema Prisma

```prisma
model Meeting {
  id              String   @id @default(uuid())
  companyOrPerson String   // Texto livre para Empresa/Pessoa
  theme           String   // Tema da reunião
  date            DateTime // Data da reunião
  startTime       DateTime // Data/Hora de início
  endTime         DateTime // Data/Hora de término
  content         String?  // Conteúdo da ata em Rich Text (Notion-like)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  participants    Person[] @relation("MeetingParticipants")

  @@index([userId])
}

// O modelo Person será atualizado para incluir a relação inversa:
// meetings Meeting[] @relation("MeetingParticipants")
```

---

## 📋 Cronograma de Tarefas (Task Breakdown)

### 🧱 Fase 1: Fundações & Banco de Dados (Priority: P0)
- [ ] **Tarefa 1.1: Atualização do Schema Prisma**
  - **Agente:** `database-architect`
  - **Skill:** `database-design`, `prisma-expert`
  - **INPUT:** `prisma/schema.prisma`
  - **OUTPUT:** Modelo `Meeting` adicionado, relação inversa no modelo `Person` e relação com `User`.
  - **VERIFICAÇÃO:** Executar `npx prisma validate`.
- [ ] **Tarefa 1.2: Geração e Execução da Migração**
  - **Agente:** `database-architect`
  - **Skill:** `prisma-expert`
  - **INPUT:** schema atualizado
  - **OUTPUT:** Nova migration gerada (`prisma/migrations/`) e banco de dados atualizado.
  - **VERIFICAÇÃO:** Executar `npx prisma migrate dev --name add_meeting_model`.

### ⚙️ Fase 2: Server Actions & Lógica de Negócios (Priority: P1)
- [ ] **Tarefa 2.1: Criar Server Actions para Reuniões**
  - **Agente:** `backend-specialist`
  - **Skill:** `nodejs-best-practices`, `api-patterns`
  - **INPUT:** Novo arquivo `src/app/actions/meetings.ts`
  - **OUTPUT:** Métodos `getMeetings`, `getMeetingById`, `createMeeting`, `updateMeeting`, `deleteMeeting` e `getMeetingFilterOptions` (para o autocomplete do combobox).
  - **VERIFICAÇÃO:** Verificação de imports e chamada de teste.

### 🎨 Fase 3: Componentes de Interface & Formulário (Priority: P2)
- [ ] **Tarefa 3.1: Componente MeetingForm**
  - **Agente:** `frontend-specialist`
  - **Skill:** `frontend-design`, `react-best-practices`
  - **INPUT:** Novo arquivo `src/components/meetings/MeetingForm.tsx`
  - **OUTPUT:** Formulário React Hook Form contendo:
    - `CreatableCombobox` para `companyOrPerson` e `theme`.
    - `MultiSelect` para selecionar `participants` da lista de contatos do usuário.
    - Campos de Data e Hora de início/término.
    - Duração calculada via frontend em tempo real (exibida no próprio formulário).
    - Editor de ata Notion-like (`RichTextEditor`).
    - Integração com auto-save caso seja uma edição.
  - **VERIFICAÇÃO:** Renderização livre de erros e comportamento correto dos autocompletes e cálculo de tempo.
- [ ] **Tarefa 3.2: Componentes de Suporte (Dialog, Table, Filters, Metrics)**
  - **Agente:** `frontend-specialist`
  - **Skill:** `frontend-design`
  - **INPUT:** Criação de `MeetingDialog.tsx`, `MeetingTable.tsx`, `MeetingFilters.tsx`, `MeetingMetrics.tsx`
  - **OUTPUT:** Lista com filtros rápidos por data/empresa, tabela com ações de exclusão/edição e cards de métricas (Número de reuniões, tempo total).
  - **VERIFICAÇÃO:** Filtros atualizando a URL corretamente; tabela listando as reuniões sem quebras.

### 🌐 Fase 4: Página de Visualização & Navegação (Priority: P2)
- [ ] **Tarefa 4.1: Criar página da rota /meetings**
  - **Agente:** `frontend-specialist`
  - **Skill:** `react-best-practices`
  - **INPUT:** `src/app/(main)/meetings/page.tsx`
  - **OUTPUT:** Página que carrega as reuniões, contatos e opções de filtro no lado do servidor (RSC) e renderiza os componentes criados.
  - **VERIFICAÇÃO:** Acesso à rota `/meetings` renderiza a página sem erros.
- [ ] **Tarefa 4.2: Integração com Sidebar**
  - **Agente:** `frontend-specialist`
  - **Skill:** `react-best-practices`
  - **INPUT:** `src/components/layout/Sidebar.tsx`
  - **OUTPUT:** Link para "/meetings" ("Reuniões") adicionado ao submenu "Conhecimento".
  - **VERIFICAÇÃO:** Link visível e clicável redirecionando para a rota correta.

---

## 🏁 Fase X: Validação & Auditoria (Final Verification)

Após a implementação, as seguintes etapas de validação serão executadas:

1. **Linting e Compilação:**
   ```bash
   npm run lint && npx tsc --noEmit
   ```
2. **Build de Produção:**
   ```bash
   npm run build
   ```
3. **Auditoria de UX/Design:**
   - Garantir conformidade WCAG AA (contraste de cores e alinhamento).
   - Sem uso de cores puras violetas/roxas fora do padrão estabelecido.
   - Teste de responsividade (dispositivos móveis e desktop).
   - Teste de fluxo de criação, edição e exclusão.

## ✅ PHASE X COMPLETE
- Lint: [ ] Pending
- Security: [ ] Pending
- Build: [ ] Pending
- Date: [Pending Approval]
