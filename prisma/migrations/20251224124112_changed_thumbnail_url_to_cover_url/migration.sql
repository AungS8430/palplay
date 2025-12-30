/*
  Warnings:

  - You are about to drop the column `thumbnailUrl` on the `group_playlist_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "group_playlist_items" DROP COLUMN "thumbnailUrl",
ADD COLUMN     "coverUrl" TEXT;
