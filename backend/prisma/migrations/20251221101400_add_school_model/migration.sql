/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,code]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sectionCode]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionNumber` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Course_code_key";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "schoolId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "sectionNumber" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "days" SET NOT NULL,
ALTER COLUMN "days" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Course_schoolId_code_key" ON "Course"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Section_sectionCode_key" ON "Section"("sectionCode");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
