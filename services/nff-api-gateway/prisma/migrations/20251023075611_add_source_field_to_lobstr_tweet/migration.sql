/*
  Warnings:

  - A unique constraint covering the columns `[source,externalId]` on the table `LobstrTweet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LobstrTweet" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'lobstr';

-- CreateIndex
CREATE UNIQUE INDEX "LobstrTweet_source_externalId_key" ON "LobstrTweet"("source", "externalId");
