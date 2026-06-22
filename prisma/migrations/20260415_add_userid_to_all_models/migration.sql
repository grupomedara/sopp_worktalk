-- AlterTable: Add userId to Goal
ALTER TABLE "Goal" ADD COLUMN "userId" TEXT;

-- AlterTable: Add userId to Task
ALTER TABLE "Task" ADD COLUMN "userId" TEXT;

-- AlterTable: Add userId to Study
ALTER TABLE "Study" ADD COLUMN "userId" TEXT;

-- AlterTable: Add userId to Lesson
ALTER TABLE "Lesson" ADD COLUMN "userId" TEXT;

-- AlterTable: Add userId to Finance
ALTER TABLE "Finance" ADD COLUMN "userId" TEXT;

-- AlterTable: Add userId to Event
ALTER TABLE "Event" ADD COLUMN "userId" TEXT;

-- AlterTable: Add userId to Note
ALTER TABLE "Note" ADD COLUMN "userId" TEXT;

-- AlterTable: Add userId to Fichamento
ALTER TABLE "Fichamento" ADD COLUMN "userId" TEXT;

-- AlterTable: Add userId to Interaction
ALTER TABLE "Interaction" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Study_userId_idx" ON "Study"("userId");

-- CreateIndex
CREATE INDEX "Lesson_userId_idx" ON "Lesson"("userId");

-- CreateIndex
CREATE INDEX "Finance_userId_idx" ON "Finance"("userId");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Fichamento_userId_idx" ON "Fichamento"("userId");

-- CreateIndex
CREATE INDEX "Interaction_userId_idx" ON "Interaction"("userId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Study" ADD CONSTRAINT "Study_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fichamento" ADD CONSTRAINT "Fichamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
