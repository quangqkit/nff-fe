-- DropIndex
DROP INDEX IF EXISTS "Tweet_category_idx";

-- AlterTable
ALTER TABLE "Tweet" DROP COLUMN IF EXISTS "category";

