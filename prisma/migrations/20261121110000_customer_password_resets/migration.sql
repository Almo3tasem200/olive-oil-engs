CREATE TABLE "CustomerPasswordReset" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "codeHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerPasswordReset_customerId_createdAt_idx" ON "CustomerPasswordReset"("customerId", "createdAt");
CREATE INDEX "CustomerPasswordReset_expiresAt_idx" ON "CustomerPasswordReset"("expiresAt");

ALTER TABLE "CustomerPasswordReset" ADD CONSTRAINT "CustomerPasswordReset_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
