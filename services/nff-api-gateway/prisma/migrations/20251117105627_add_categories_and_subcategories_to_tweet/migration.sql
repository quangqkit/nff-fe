-- AlterTable
ALTER TABLE "Tweet" ADD COLUMN "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "subCategories" JSONB;
