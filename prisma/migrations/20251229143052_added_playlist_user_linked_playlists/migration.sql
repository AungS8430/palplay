-- CreateTable
CREATE TABLE "group_playlist_user_linked_playlists" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalPlaylistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_playlist_user_linked_playlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_playlist_user_linked_playlists_groupId_userId_provide_key" ON "group_playlist_user_linked_playlists"("groupId", "userId", "provider");
