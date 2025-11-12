-- CreateTable
CREATE TABLE "public"."LobstrSchedule" (
    "id" SERIAL NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cronExpression" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
    "lookbackHours" INTEGER NOT NULL DEFAULT 4,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accounts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LobstrSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LobstrRun" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "runId" TEXT NOT NULL,
    "runType" TEXT NOT NULL DEFAULT 'auto',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "tweetsFetched" INTEGER NOT NULL DEFAULT 0,
    "tweetsProcessed" INTEGER NOT NULL DEFAULT 0,
    "tweetsDropped" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LobstrRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LobstrTweet" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "tweetId" TEXT NOT NULL,
    "externalId" TEXT,
    "authorId" TEXT,
    "authorHandle" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReply" BOOLEAN NOT NULL DEFAULT false,
    "isRetweet" BOOLEAN NOT NULL DEFAULT false,
    "publicMetrics" JSONB,
    "urls" JSONB,
    "symbols" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawData" JSONB,

    CONSTRAINT "LobstrTweet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LobstrSchedule_scheduleId_key" ON "public"."LobstrSchedule"("scheduleId");

-- CreateIndex
CREATE INDEX "LobstrSchedule_scheduleId_idx" ON "public"."LobstrSchedule"("scheduleId");

-- CreateIndex
CREATE INDEX "LobstrSchedule_isActive_idx" ON "public"."LobstrSchedule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LobstrRun_runId_key" ON "public"."LobstrRun"("runId");

-- CreateIndex
CREATE INDEX "LobstrRun_scheduleId_idx" ON "public"."LobstrRun"("scheduleId");

-- CreateIndex
CREATE INDEX "LobstrRun_status_idx" ON "public"."LobstrRun"("status");

-- CreateIndex
CREATE INDEX "LobstrRun_windowStart_windowEnd_idx" ON "public"."LobstrRun"("windowStart", "windowEnd");

-- CreateIndex
CREATE INDEX "LobstrRun_runType_idx" ON "public"."LobstrRun"("runType");

-- CreateIndex
CREATE UNIQUE INDEX "LobstrTweet_tweetId_key" ON "public"."LobstrTweet"("tweetId");

-- CreateIndex
CREATE INDEX "LobstrTweet_tweetId_idx" ON "public"."LobstrTweet"("tweetId");

-- CreateIndex
CREATE INDEX "LobstrTweet_runId_idx" ON "public"."LobstrTweet"("runId");

-- CreateIndex
CREATE INDEX "LobstrTweet_createdAt_idx" ON "public"."LobstrTweet"("createdAt");

-- CreateIndex
CREATE INDEX "LobstrTweet_language_idx" ON "public"."LobstrTweet"("language");

-- CreateIndex
CREATE INDEX "LobstrTweet_isReply_isRetweet_idx" ON "public"."LobstrTweet"("isReply", "isRetweet");

-- CreateIndex
CREATE INDEX "LobstrTweet_symbols_idx" ON "public"."LobstrTweet"("symbols");

-- AddForeignKey
ALTER TABLE "public"."LobstrRun" ADD CONSTRAINT "LobstrRun_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."LobstrSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LobstrTweet" ADD CONSTRAINT "LobstrTweet_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."LobstrRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
