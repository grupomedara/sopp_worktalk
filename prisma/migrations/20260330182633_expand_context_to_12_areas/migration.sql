-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Context" ADD VALUE 'SAUDE';
ALTER TYPE "Context" ADD VALUE 'INTELECTUAL';
ALTER TYPE "Context" ADD VALUE 'EMOCIONAL';
ALTER TYPE "Context" ADD VALUE 'REALIZACAO';
ALTER TYPE "Context" ADD VALUE 'FINANCEIRO';
ALTER TYPE "Context" ADD VALUE 'SOCIAL';
ALTER TYPE "Context" ADD VALUE 'RELACIONAMENTO';
ALTER TYPE "Context" ADD VALUE 'VIDA_SOCIAL';
ALTER TYPE "Context" ADD VALUE 'LAZER';
ALTER TYPE "Context" ADD VALUE 'FELICIDADE';
