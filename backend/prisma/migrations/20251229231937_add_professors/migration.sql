-- CreateTable
CREATE TABLE "Professor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rmpId" TEXT,
    "rating" DOUBLE PRECISION,
    "difficulty" DOUBLE PRECISION,
    "numRatings" INTEGER,

    CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professor_name_key" ON "Professor"("name");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_instructor_fkey" FOREIGN KEY ("instructor") REFERENCES "Professor"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
