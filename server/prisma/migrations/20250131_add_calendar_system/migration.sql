-- CreateTable
CREATE TABLE "Calendar" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "titleBn" TEXT,
    "imageUrl" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cityCorporationId" INTEGER,
    "zoneId" INTEGER,
    "wardId" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" SERIAL NOT NULL,
    "calendarId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleBn" TEXT,
    "description" TEXT,
    "descriptionBn" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'general',
    "category" TEXT NOT NULL DEFAULT 'communityEvent',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Calendar_cityCorporationId_idx" ON "Calendar"("cityCorporationId");

-- CreateIndex
CREATE INDEX "Calendar_zoneId_idx" ON "Calendar"("zoneId");

-- CreateIndex
CREATE INDEX "Calendar_wardId_idx" ON "Calendar"("wardId");

-- CreateIndex
CREATE INDEX "Calendar_month_year_idx" ON "Calendar"("month", "year");

-- CreateIndex
CREATE INDEX "Calendar_isActive_idx" ON "Calendar"("isActive");

-- CreateIndex
CREATE INDEX "CalendarEvent_calendarId_idx" ON "CalendarEvent"("calendarId");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventDate_idx" ON "CalendarEvent"("eventDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_isActive_idx" ON "CalendarEvent"("isActive");

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_cityCorporationId_fkey" FOREIGN KEY ("cityCorporationId") REFERENCES "CityCorporation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
