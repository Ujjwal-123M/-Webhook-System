/*
  Warnings:

  - You are about to drop the column `responseBody` on the `attempt_logs` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_attempt_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryId" TEXT NOT NULL,
    "attemptNum" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "error" TEXT,
    "durationMs" INTEGER NOT NULL,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attempt_logs_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_attempt_logs" ("attemptNum", "attemptedAt", "deliveryId", "durationMs", "error", "id", "statusCode") SELECT "attemptNum", "attemptedAt", "deliveryId", "durationMs", "error", "id", "statusCode" FROM "attempt_logs";
DROP TABLE "attempt_logs";
ALTER TABLE "new_attempt_logs" RENAME TO "attempt_logs";
CREATE INDEX "attempt_logs_deliveryId_idx" ON "attempt_logs"("deliveryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
