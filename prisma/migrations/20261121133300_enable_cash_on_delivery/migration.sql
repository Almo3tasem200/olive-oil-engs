ALTER TABLE "StoreSettings"
ALTER COLUMN "codEnabled" SET DEFAULT true;

UPDATE "StoreSettings"
SET "codEnabled" = true
WHERE id = 1;
