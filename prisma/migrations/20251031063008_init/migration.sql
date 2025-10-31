/*
  Warnings:

  - You are about to drop the column `deleted` on the `invite_links` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invite_links" DROP COLUMN "deleted",
ADD COLUMN     "oneTimeUse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "valid" BOOLEAN NOT NULL DEFAULT true;
