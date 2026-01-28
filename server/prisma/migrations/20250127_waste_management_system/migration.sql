-- CreateEnum
CREATE TYPE "WastePostCategory" AS ENUM ('CURRENT_WASTE', 'FUTURE_WASTE');

-- CreateEnum
CREATE TYPE "WastePostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "waste_posts" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" VARCHAR(500),
    "category" "WastePostCategory" NOT NULL,
    "status" "WastePostStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waste_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_post_reactions" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "reactionType" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_post_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waste_posts_status_idx" ON "waste_posts"("status");

-- CreateIndex
CREATE INDEX "waste_posts_category_idx" ON "waste_posts"("category");

-- CreateIndex
CREATE INDEX "waste_posts_createdBy_idx" ON "waste_posts"("createdBy");

-- CreateIndex
CREATE INDEX "waste_posts_publishedAt_idx" ON "waste_posts"("publishedAt");

-- CreateIndex
CREATE INDEX "waste_posts_status_category_idx" ON "waste_posts"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "waste_post_reactions_postId_userId_key" ON "waste_post_reactions"("postId", "userId");

-- CreateIndex
CREATE INDEX "waste_post_reactions_postId_idx" ON "waste_post_reactions"("postId");

-- CreateIndex
CREATE INDEX "waste_post_reactions_userId_idx" ON "waste_post_reactions"("userId");

-- CreateIndex
CREATE INDEX "waste_post_reactions_reactionType_idx" ON "waste_post_reactions"("reactionType");
