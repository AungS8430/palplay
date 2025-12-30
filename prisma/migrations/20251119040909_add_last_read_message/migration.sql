-- CreateTable
CREATE TABLE "last_read_messages" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'message',

    CONSTRAINT "last_read_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "last_read_messages_groupId_userId_type_key" ON "last_read_messages"("groupId", "userId", "type");
