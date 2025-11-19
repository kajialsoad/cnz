-- AlterTable: Make category and subcategory fields optional
-- This allows existing complaints without categories to remain valid

ALTER TABLE `Complaint` MODIFY `category` VARCHAR(191) NULL;
ALTER TABLE `Complaint` MODIFY `subcategory` VARCHAR(191) NULL;
