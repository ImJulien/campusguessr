/*
  Warnings:

  - Added the required column `actualLat` to the `Score` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actualLng` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_locationId_fkey";

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "actualLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "actualLng" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "guessLat" DOUBLE PRECISION,
ADD COLUMN     "guessLng" DOUBLE PRECISION,
ALTER COLUMN "locationId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Score_gameId_idx" ON "Score"("gameId");

-- CreateIndex
CREATE INDEX "Score_playerId_idx" ON "Score"("playerId");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
