/*
  Warnings:

  - You are about to drop the column `difficulty` on the `Professor` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Professor` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_userId_fkey";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "career" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "geCode" TEXT,
ADD COLUMN     "grading" TEXT,
ADD COLUMN     "prerequisites" TEXT,
ALTER COLUMN "instructor" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Professor" DROP COLUMN "difficulty",
DROP COLUMN "rating",
ADD COLUMN     "avgDifficulty" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "avgRating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "rmpLink" TEXT,
ADD COLUMN     "wouldTakeAgain" TEXT DEFAULT 'N/A',
ALTER COLUMN "numRatings" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "classNumber" TEXT,
ADD COLUMN     "instructionMode" TEXT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
