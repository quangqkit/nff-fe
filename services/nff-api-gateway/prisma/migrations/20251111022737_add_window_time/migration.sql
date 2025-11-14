-- CreateTable
CREATE TABLE "public"."WindowSchedule" (
    "id" SERIAL NOT NULL,
    "windowTime" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lobstrScheduleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WindowSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WindowSchedule_windowTime_key" ON "public"."WindowSchedule"("windowTime");

-- CreateIndex
CREATE INDEX "WindowSchedule_windowTime_idx" ON "public"."WindowSchedule"("windowTime");
