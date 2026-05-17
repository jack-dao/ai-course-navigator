DELETE FROM "Schedule" older
USING "Schedule" newer
WHERE older."userId" = newer."userId"
  AND older."name" = newer."name"
  AND (
    older."createdAt" < newer."createdAt"
    OR (older."createdAt" = newer."createdAt" AND older."id" < newer."id")
  );

DROP INDEX IF EXISTS "Schedule_userId_name_idx";

CREATE UNIQUE INDEX "Schedule_userId_name_key" ON "Schedule"("userId", "name");
