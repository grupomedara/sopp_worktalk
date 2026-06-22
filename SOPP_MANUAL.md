# SOPP: Manual do Sistema Operacional Pessoal e Profissional

Bem-vindo ao **SOPP** (Sistema Operacional Pessoal e Profissional). Este documento serve como um guia completo para você dominar as funcionalidades do sistema, projetado para oferecer fluidez, interconectividade e alta performance na sua gestão diária.

---

## 🌑 Estética e Filosofia: Modern Noir
O sistema utiliza uma estética "Modern Noir" — interfaces escuras, minimalistas, com tipografia premium e elementos em glassmorphism (vidro fosco). A filosofia é a **gestão verticalizada**: do objetivo estratégico à tarefa tática, tudo está conectado.

---

## ⚡ 1. Command Center (Atalho Universal & Captura Inteligente)
O coração da navegação e produtividade do SOPP.
- **Atalho**: Pressione `Ctrl + K` (ou `Cmd + K`) em qualquer tela.
- **Pesquisa Universal**: Digite o nome de uma nota, projeto, tarefa ou pessoa para saltar diretamente para ela.
- **Captura Inteligente (NLP)**: Use linguagem natural para criar tarefas instantaneamente.
  - **Ativação**: Comece a digitar qualquer frase no `Ctrl+K`. O sistema analisará o texto em tempo real.
  - **Comandos Mágicos**:
    - `@Menção`: Busca e vincula automaticamente Pessoas ou Projetos (ex: `@Socio`, `@Marketing`).
    - `#Contexto`: Define a categoria da tarefa usando as 12 áreas da Roda da Vida (ex: `#Realização`, `#Saúde`, `#Intelectual`, `#Financeiro`).
    - **Datas/Horas**: Entende frases como *"amanhã 14h"*, *"hoje às 20:00"*, *"próxima segunda"*.
  - **Salvamento**: Pressione **Enter** quando o card "Captura Inteligente" estiver visível para salvar a tarefa no banco de dados.
- **Ações Rápidas**: Use para navegar ou capturar ideias sem tirar as mãos do teclado.

---

## 📊 2. Dashboard: O Daily Briefing
Sua central de comando matinal.
- **Metrics**: Visão instantânea de tarefas pendentes, projetos ativos e crescimento da rede.
- **Radar Agile**: Monitoramento em tempo real de Sprints ativos e progresso percentual.
- **Briefing de Notas**: Suas últimas ideias e capturas do "cérebro digital" aparecem aqui.
- **Execução Estratégica**: Barras de progresso dos seus OKRs (Objetivos e Resultados-Chave).
- **Accelerators**: Botões rápidos para criar notas, tarefas ou projetos.

---

## 🧠 3. Notas (Cérebro Digital Estilo Obsidian)
Transforme notas estáticas em uma rede de conhecimento interconectada.
- **Wiki-links**: Digite `[[Nome da Nota]]` dentro de qualquer nota para criar um link automático para ela.
- **Menções**: Use `@` para mencionar pessoas ou projetos. Ao passar o mouse, um **Hover Card** mostrará um resumo da entidade mencionada.
- **Markdown-Lite**:
  - `[ ]` ou `[x]` cria checklists interativos.
  - `-` cria listas de tópicos.
- **Backlinks**: No rodapé de cada nota, você verá quais outras notas citam a que você está lendo.

### Botões de Ação Rápida na tela de Notas
No topo da página de Notas há 4 botões de atalho:

| Botão | O que faz |
|-------|-----------|
| **Nova Nota** | Abre o dialog para criar uma nota de texto |
| **Brain Flow** | Abre o dialog para criar um mapa mental (canvas) |
| **Sprint** | Navega para o módulo Agile (/agile) |
| **Ações** | Navega para o módulo de Tarefas (/tasks) |

### 🧩 3.1 Brain Flow — Motor de Mapa Mental (React Flow)
Visualize e conecte ideias em um canvas infinito de alta performance.

- **Acesso**: Clique em **"Abrir Brain Flow"** na listagem de notas (ícone de fluxo) ou pelo atalho no Dashboard.
- **Controles do Canvas**:
  - **Scroll** → Zoom in/out
  - **Clique e arraste no fundo** → Pan (mover câmera)
  - **Clique em um nó** → Seleciona
  - **Duplo clique em um nó** → Edita o texto inline; pressione `Enter` ou clique fora para confirmar
- **Adicionar nós**: Clique em **`+ Nó`** no cabeçalho.
- **Conectar nós**:
  1. Passe o mouse sobre um nó — 4 bolinhas brancas aparecem (cima, baixo, esquerda, direita).
  2. Clique e arraste de **qualquer bolinha** até qualquer parte do nó de destino.
  3. Uma linha animada de conexão será criada automaticamente.
- **Deletar**: Selecione um nó ou linha e clique em **`Deletar`** no cabeçalho (ou pressione `Delete`).
- **Salvar**: Clique em **`Salvar`** — o mapa (nós + conexões) é persistido no banco de dados e restaurado na próxima abertura.
- **Minimap**: Canto inferior direito — visão geral do mapa inteiro.
- **Controles de Zoom**: Canto inferior esquerdo — zoom in, out, fit view.

---

## 📈 4. OKRs e Estratégia
Gestão de metas de alto nível seguindo a metodologia Google/Intel.
- **Goal (Meta)**: Define o "O quê" (ex: "Dobrar faturamento 2026").
- **Objective (Objetivo)**: Desdobramento tático dentro dos projetos.
- **Key Results (Resultados-Chave)**: Métricas quantificáveis (ex: "Atingir 100 vendas") que alimentam o progresso da Meta.

---

## 🏃 5. Gestão Agile e Projetos
Execução tática moderna.
- **Sprints**: Ciclos de trabalho com data de início/fim, metas específicas e retrospectivas.
- **Kanban**: Organize tarefas em colunas (A fazer, Fazendo, Revisão, Feito).
- **Projetos Sugeridos**: O sistema diferencia projetos "Standard" de projetos "Agile" (baseados em sprints).

---

## 📅 6. Agenda Tática
- **Visão de Timeline**: Visualize todos os seus compromissos e tarefas datadas em uma linha do tempo clara.
- **Contextos**: Organize eventos pelas 12 áreas da Roda da Vida (Saúde, Intelectual, Emocional, Realização, Financeiro, Social, Família, Relacionamento, Vida Social, Lazer, Felicidade e Espiritualidade).

---

## 👥 7. People (Rede e Networking)
Gerencie seu capital social.
- **CRM Pessoal**: Cadastro de contatos com tipos (Filho, Sócio, Cliente, Colaborador).
- **Conexões**: Veja notas e projetos relacionados a cada pessoa diretamente no perfil dela.

---

## 📚 8. Estudos e Aulas (Learning & Teaching)
- **Study Log**: Registre o tempo investido em cada tema ou disciplina.
- **Leitura de Livros**: Acompanhe seu progresso de leitura por capítulo. Acesse pelo módulo de Estudos para cadastrar livros, atualizar o capítulo atual e vincular notas com resumos.
- **Lesson Planning**: Para instrutores, documente conteúdo aplicado, materiais e acompanhamento de alunos.

---

## 💰 9. Finance (Gestão de Fluxo Pix)
Controle financeiro com rastreabilidade completa.
- **Registros Pix**: Criação de registros com valor, cliente, CPF e filial.
- **Comprovantes**: Geração de comprovante com assinatura digital. O PDF pode ser impresso ou salvo.
- **Aprovações**: Fluxo de aprovação com histórico. Registros de supervisores são priorizados no topo da fila.
- **Devoluções**: Registros devolvidos são exibidos em vermelho com o motivo da devolução.
- **Permissões**:
  - `ADMIN` / `MASTER`: podem criar, aprovar e deletar registros.
  - `SUPERVISOR`: pode criar registros para qualquer filial (com prioridade).
  - `USER`: visualiza e processa apenas registros da sua filial.
- **Categorias**: Separação entre vida Pessoal, Empresa e Dependente.

---

## 🔔 10. Notificações Push (PWA)
O sistema suporta notificações nativas em tempo real para celulares e desktop.
- **Ativação**: Um botão flutuante com ícone de **Sino** estará visível no canto inferior direito da tela caso as notificações não estejam autorizadas. 
- **Registro**: Clique no Sino e autorize as permissões no seu navegador. Uma vez concedida a permissão, o Sino se ocultará automaticamente.
- **Lembretes Automáticos**: O sistema possui uma automação (Cron Job) que dispara avisos de Tarefas e Eventos de Agenda pendentes diretamente na tela do seu aparelho.
- **Outros gatilhos**: Registros Pix, Pedidos de Ajuda e Diagnósticos também geram alertas internos.

---

## 📱 11. PWA Mobile
O SOPP pode ser instalado como aplicativo no celular.
- **Como instalar (Android)**: Abra o Chrome → menu `⋮` → "Adicionar à tela inicial".
- **Como instalar (iOS)**: Abra o Safari → botão Compartilhar → "Adicionar à Tela de Início".
- **Navegação mobile**: Em telas pequenas, a sidebar lateral é substituída por uma **Bottom Navigation** com os 5 módulos principais (Dashboard, Agile, Tarefas, Finanças, Perfil).
- A navegação mobile foi agrupada em **Submenus** para evitar poluição visual.
- O app agora suporta **Rotação automática** da tela em aparelhos Android e iOS.
- O app abre em modo standalone (sem barra do browser), com suporte a notch e home indicator.

---

## ⚖️ 12. Protocolo de Testes (Validando o Pro Max)
Para garantir que o seu SOPP está operando com 100% de precisão lógica, siga esta sequência de testes no Command Center (`Ctrl+K`):

1. **Teste de Data Simples**: Digite *"Ligar para cliente amanhã às 14:00"*.
   - *Verifique se o badge mostra a data correta de amanhã.*
2. **Teste de Menção Inteligente**: Digite *"Reunião com @Socio"*.
   - *Verifique se o sistema detectou o nome e se ele existe na sua base de Pessoas.*
3. **Teste de Contexto (#Tag)**: Digite *"Estudar anatomia #Intelectual"*.
   - *O contexto deve mudar para 'INTELECTUAL' automaticamente no badge.*
4. **Teste de Título Limpo**: Digite *"Comprar café amanhã às 08:00 #VidaSocial"*.
   - *O título da tarefa criada deve ser apenas "Comprar café".*
5. **Teste Combinado (Hard)**: Digite *"Apresentação estratégica @Marketing amanhã 10:00 #Realização"*.
   - *Pressione Enter e verifique no dashboard se a tarefa foi criada com todos os campos preenchidos.*

---

## 📂 13. Navegação por Grupos (SaaS Core)
Para manter o ambiente de trabalho organizado e com estética de software Premium, os menus laterais aglutinam os recursos em **Acordeões Dinâmicos**:
- **Execução**: Agile, Projetos, Tarefas e Agenda.
- **Pessoas**: Gerenciamento de Rede e CRM.
- **Conhecimento**: Estudos, Aulas e Notas de texto.
- **Finanças & Roda da Vida**: Finanças e Módulo Espiritual.
- **Sistema**: Perfil e Administração.

*Dica:* No desktop, ao expandir uma categoria, ela continuará visível. No mobile, os blocos se adaptam em listas verticais de toque rápido.

---

## 🛠️ Dicas de Performance
1. **Atalhos**: O sistema é otimizado para teclado. Use o `Ctrl+K`.
2. **Contexto**: Sempre atribua um contexto (Saúde, Intelectual, Realização, etc.) para facilitar a filtragem.
3. **Consistência**: O dashboard é alimentado pela sua atividade. Quanto mais você registra, mais inteligente o "Daily Briefing" se torna.

---
**SOPP v2.3** - *PWA Mobile + Push Notification e Menus Dynamic-Flow integrados. Sincronizado via Git.*
