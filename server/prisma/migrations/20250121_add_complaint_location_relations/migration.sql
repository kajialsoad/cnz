-- Add foreign key constraints for complaint location fields
-- These fields track where the complaint was submitted (not where the user lives)

-- Note: The fields already exist, we're just adding the foreign key constraints
-- to enable Prisma relations

-- No schema changes needed, just updating Prisma schema to add relations
-- The foreign keys will be handled by Prisma's relation system
