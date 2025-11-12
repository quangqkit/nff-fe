-- CreateTable
CREATE TABLE "TradingViewStock" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "companyName" VARCHAR(200) NOT NULL,
    "preMarketChangePercent" VARCHAR(20),
    "marketCap" VARCHAR(50),
    "source" VARCHAR(50) NOT NULL DEFAULT 'tradingview',
    "dataType" VARCHAR(20) NOT NULL,
    "fetchTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingViewStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradingViewStock_symbol_idx" ON "TradingViewStock"("symbol");

-- CreateIndex
CREATE INDEX "TradingViewStock_dataType_idx" ON "TradingViewStock"("dataType");

-- CreateIndex
CREATE INDEX "TradingViewStock_fetchTime_idx" ON "TradingViewStock"("fetchTime");

-- CreateIndex
CREATE INDEX "TradingViewStock_createdAt_idx" ON "TradingViewStock"("createdAt");
