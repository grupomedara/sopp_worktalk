/*
  Warnings:

  - You are about to drop the column `cpf` on the `Person` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Person" DROP COLUMN "cpf",
ADD COLUMN     "document" TEXT;
