ALTER TABLE "TweetRaw"
    ADD CONSTRAINT "TweetRaw_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "LobstrSchedule"("scheduleId") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "TweetRaw_runId_fkey" FOREIGN KEY ("runId") REFERENCES "LobstrRun"("runId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TweetProcessingJob"
    ADD CONSTRAINT "TweetProcessingJob_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "LobstrSchedule"("scheduleId") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "TweetProcessingJob_runId_fkey" FOREIGN KEY ("runId") REFERENCES "LobstrRun"("runId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TweetClassification"
    ADD CONSTRAINT "TweetClassification_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "LobstrSchedule"("scheduleId") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "TweetClassification_runId_fkey" FOREIGN KEY ("runId") REFERENCES "LobstrRun"("runId") ON DELETE CASCADE ON UPDATE CASCADE;

