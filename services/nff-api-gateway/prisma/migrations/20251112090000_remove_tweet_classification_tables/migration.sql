-- Drop tweet classification and processing tables
DROP TABLE IF EXISTS "public"."TweetClassification";
DROP TABLE IF EXISTS "public"."TweetProcessingJob";

-- Drop related enums
DROP TYPE IF EXISTS "public"."TweetProcessingStatus";
DROP TYPE IF EXISTS "public"."TweetProcessingStage";
DROP TYPE IF EXISTS "public"."TweetCategory";


