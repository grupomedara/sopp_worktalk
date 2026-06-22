# Plan: Compartilhamento de Notas e Reuniões

Este plano detalha o desenvolvimento das funcionalidades de compartilhamento para Notas/Brainflow e Reuniões/Atas.

## Project Type: WEB
- **Primary Agents:** `database-architect` (DB schema), `backend-specialist` (Server Actions), `frontend-specialist` (UI/UX)
- **Tech Stack:** Next.js (App Router), Prisma, PostgreSQL, TailwindCSS/Vanilla CSS

## File Structure Changes
- **Modified:**
  - `prisma/schema.prisma`
  - `src/app/actions/notes.ts`
  - `src/app/actions/meetings.ts`
  - `src/app/actions/mindmap.ts`
- **New:**
  - `src/components/common/ShareDialog.tsx`

---

## Task Breakdown

### P0: Foundation & Database
#### Task 1: Update Database Schema
- **Agent:** `database-architect`
- **Skills:** `database-design`
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** `prisma/schema.prisma`
- **OUTPUT:** Updated `prisma/schema.prisma` containing `NoteShare` and `MeetingShare` models.
- **VERIFY:** Run `npx prisma db push` and verify client generation without errors.

---

### P1: Server Actions & Access Rules
#### Task 2: Notes Server Actions Upgrade
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`, `clean-code`
- **Priority:** P1
- **Dependencies:** Task 1
- **INPUT:** `src/app/actions/notes.ts`
- **OUTPUT:** Actions `shareNote`, `unshareNote`, `verifyNoteEditorRights` implemented and `getNotes`/`updateNote`/`deleteNote` updated.
- **VERIFY:** Ensure TypeScript compilation with `npx tsc --noEmit`.

#### Task 3: Meetings Server Actions Upgrade
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`, `clean-code`
- **Priority:** P1
- **Dependencies:** Task 1
- **INPUT:** `src/app/actions/meetings.ts`
- **OUTPUT:** Actions `shareMeeting`, `unshareMeeting`, `verifyMeetingEditorRights` implemented and `getMeetings`/`updateMeeting`/`deleteMeeting` updated.
- **VERIFY:** Ensure TypeScript compilation with `npx tsc --noEmit`.

#### Task 4: Mind Map Action Protection
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`
- **Priority:** P1
- **Dependencies:** Task 2
- **INPUT:** `src/app/actions/mindmap.ts`
- **OUTPUT:** Mind Map update/deletion routes check the editor permission of the corresponding note.
- **VERIFY:** Ensure TypeScript compilation with `npx tsc --noEmit`.

---

### P2: UI & Sharing Dialogs
#### Task 5: Create Shared ShareDialog Component
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P2
- **Dependencies:** Task 2, Task 3
- **INPUT:** New file `src/components/common/ShareDialog.tsx`
- **OUTPUT:** A modern dialog matching the noir/glassmorphism aesthetics allowing CPF/Email lookups and role configuration.
- **VERIFY:** Build check with `npx tsc --noEmit`.

#### Task 6: Integrate ShareDialog in Notes List & Header
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P2
- **Dependencies:** Task 5
- **INPUT:** Notes list UI files and Visual Note Page.
- **OUTPUT:** Share buttons added, and write actions disabled if the user has `VIEWER` permission.
- **VERIFY:** Manual interaction check on notes dashboard.

#### Task 7: Integrate ShareDialog in Meetings Table
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P2
- **Dependencies:** Task 5
- **INPUT:** Meetings list/table UI files.
- **OUTPUT:** Share actions added to meetings table/dialogs.
- **VERIFY:** Manual interaction check on meetings dashboard.

---

## Phase X: Verification (Mandatory)
- [ ] TypeScript Compilation: `npx tsc --noEmit` returns no errors.
- [ ] Build Check: `npm run build` succeeds.
- [ ] Security Scan: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .` passes.
- [ ] UX Audit: `python .agent/skills/frontend-design/scripts/ux_audit.py .` passes.
- [ ] No purple/violet color hex codes added.
