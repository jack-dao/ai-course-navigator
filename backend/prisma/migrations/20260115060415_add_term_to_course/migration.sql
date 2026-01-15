/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,code,term]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Course_schoolId_code_key";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "term" TEXT NOT NULL DEFAULT 'Winter 2026';

-- CreateIndex
CREATE UNIQUE INDEX "Course_schoolId_code_term_key" ON "Course"("schoolId", "code", "term");
