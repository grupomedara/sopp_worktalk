/*
  Warnings:

  - You are about to drop the column `address` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `passport` on the `Person` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PersonKind" AS ENUM ('FISICA', 'JURIDICA');

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "address",
DROP COLUMN "passport",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "fantasyName" TEXT,
ADD COLUMN     "kind" "PersonKind" NOT NULL DEFAULT 'FISICA',
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "stateRegistration" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "zipCode" TEXT;
