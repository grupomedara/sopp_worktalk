-- AlterTable
ALTER TABLE "Finance" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE';
