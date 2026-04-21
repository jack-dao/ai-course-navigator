-- CreateIndex
CREATE INDEX "Course_term_idx" ON "Course"("term");

-- CreateIndex
CREATE INDEX "Schedule_userId_name_idx" ON "Schedule"("userId", "name");

-- CreateIndex
CREATE INDEX "Section_courseId_idx" ON "Section"("courseId");

-- CreateIndex
CREATE INDEX "Section_parentId_idx" ON "Section"("parentId");
