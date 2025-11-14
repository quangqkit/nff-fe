-- AddForeignKey
ALTER TABLE "public"."TweetRaw" ADD CONSTRAINT "TweetRaw_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "public"."Tweet"("tweetId") ON DELETE SET NULL ON UPDATE CASCADE;
