/*
  Warnings:

  - A unique constraint covering the columns `[source,externalId]` on the table `TweetRaw` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TweetRaw_source_externalId_key" ON "public"."TweetRaw"("source", "externalId");
