/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "posts" DROP COLUMN "deletedAt",
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;
