-- CreateEnum
CREATE TYPE "GalleryImageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(500) NOT NULL,
    "status" "GalleryImageStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_images_status_idx" ON "gallery_images"("status");

-- CreateIndex
CREATE INDEX "gallery_images_displayOrder_idx" ON "gallery_images"("displayOrder");

-- CreateIndex
CREATE INDEX "gallery_images_createdBy_idx" ON "gallery_images"("createdBy");

-- CreateIndex
CREATE INDEX "gallery_images_status_displayOrder_idx" ON "gallery_images"("status", "displayOrder");
