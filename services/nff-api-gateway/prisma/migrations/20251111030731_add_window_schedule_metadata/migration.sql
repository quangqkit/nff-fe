-- AlterTable
ALTER TABLE "public"."WindowSchedule" ADD COLUMN     "lookbackHours" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem';
