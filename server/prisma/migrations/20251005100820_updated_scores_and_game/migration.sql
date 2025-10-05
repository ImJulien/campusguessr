/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roundNumber` to the `Score` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeLeft` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Location" DROP CONSTRAINT "Location_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_locationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_playerId_fkey";

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "grade" TEXT,
ADD COLUMN     "xpEarned" INTEGER;

-- AlterTable
ALTER TABLE "Score" DROP COLUMN "createdAt",
DROP COLUMN "locationId",
DROP COLUMN "playerId",
DROP COLUMN "time",
ADD COLUMN     "actualLocation" INTEGER[],
ADD COLUMN     "guessedLocation" INTEGER[],
ADD COLUMN     "roundNumber" INTEGER NOT NULL,
ADD COLUMN     "timeLeft" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."Location";
