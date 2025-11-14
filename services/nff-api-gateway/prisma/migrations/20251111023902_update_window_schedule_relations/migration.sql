/*
  Warnings:

  - You are about to drop the column `lobstrScheduleIds` on the `WindowSchedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."LobstrSchedule" ADD COLUMN     "windowScheduleId" INTEGER;

-- AlterTable
ALTER TABLE "public"."WindowSchedule" DROP COLUMN "lobstrScheduleIds";

-- CreateIndex
CREATE INDEX "LobstrSchedule_windowScheduleId_idx" ON "public"."LobstrSchedule"("windowScheduleId");

-- AddForeignKey
ALTER TABLE "public"."LobstrSchedule" ADD CONSTRAINT "LobstrSchedule_windowScheduleId_fkey" FOREIGN KEY ("windowScheduleId") REFERENCES "public"."WindowSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
