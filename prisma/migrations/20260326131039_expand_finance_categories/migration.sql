-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FinanceCategory" ADD VALUE 'RECEITA_SALARIO';
ALTER TYPE "FinanceCategory" ADD VALUE 'RECEITA_INVESTIMENTO';
ALTER TYPE "FinanceCategory" ADD VALUE 'RECEITA_VENDA';
ALTER TYPE "FinanceCategory" ADD VALUE 'RECEITA_SERVICO';
ALTER TYPE "FinanceCategory" ADD VALUE 'MORADIA';
ALTER TYPE "FinanceCategory" ADD VALUE 'ALIMENTACAO';
ALTER TYPE "FinanceCategory" ADD VALUE 'TRANSPORTE';
ALTER TYPE "FinanceCategory" ADD VALUE 'SAUDE';
ALTER TYPE "FinanceCategory" ADD VALUE 'EDUCACAO';
ALTER TYPE "FinanceCategory" ADD VALUE 'SERVICOS_ESSENCIAIS';
ALTER TYPE "FinanceCategory" ADD VALUE 'LAZER';
ALTER TYPE "FinanceCategory" ADD VALUE 'RESTAURANTES';
ALTER TYPE "FinanceCategory" ADD VALUE 'COMPRAS';
ALTER TYPE "FinanceCategory" ADD VALUE 'VIAGENS';
ALTER TYPE "FinanceCategory" ADD VALUE 'FILHO_ESCOLA';
ALTER TYPE "FinanceCategory" ADD VALUE 'FILHO_SAUDE';
ALTER TYPE "FinanceCategory" ADD VALUE 'FILHO_LAZER';
ALTER TYPE "FinanceCategory" ADD VALUE 'EMPRESA_OPERACIONAL';
ALTER TYPE "FinanceCategory" ADD VALUE 'EMPRESA_MARKETING';
ALTER TYPE "FinanceCategory" ADD VALUE 'EMPRESA_IMPOSTOS';
ALTER TYPE "FinanceCategory" ADD VALUE 'EMPRESA_EQUIPE';
ALTER TYPE "FinanceCategory" ADD VALUE 'OUTROS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RecurrenceType" ADD VALUE 'WEEKLY_MWF';
ALTER TYPE "RecurrenceType" ADD VALUE 'WEEKLY_TTH';
ALTER TYPE "RecurrenceType" ADD VALUE 'WEEKDAYS';
ALTER TYPE "RecurrenceType" ADD VALUE 'WEEKDAYS_SAT';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "color" TEXT,
ADD COLUMN     "reminderMinutes" INTEGER,
ADD COLUMN     "startNotified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Finance" ADD COLUMN     "reminderMinutes" INTEGER;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "bookId" TEXT;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "reminderMinutes" INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "color" TEXT,
ADD COLUMN     "reminderMinutes" INTEGER;

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "totalChapters" INTEGER NOT NULL,
    "currentChapter" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'READING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prayer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Prayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleReadingPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibleReadingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibleReadingDay" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "books" TEXT NOT NULL,
    "chapters" TEXT NOT NULL,

    CONSTRAINT "BibleReadingDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBiblePlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "status" "Status" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "UserBiblePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alarm" (
    "id" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alarm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prayer" ADD CONSTRAINT "Prayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibleReadingDay" ADD CONSTRAINT "BibleReadingDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BibleReadingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBiblePlan" ADD CONSTRAINT "UserBiblePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBiblePlan" ADD CONSTRAINT "UserBiblePlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BibleReadingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
