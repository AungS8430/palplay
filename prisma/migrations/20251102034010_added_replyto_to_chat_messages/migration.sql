-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "replyToId" TEXT;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
