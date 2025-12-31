-- CreateIndex
CREATE INDEX "idx_group_member_user" ON "group_members"("userId");

-- CreateIndex
CREATE INDEX "idx_group_member_group" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX "idx_group_public_created" ON "groups"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "idx_join_request_user_status" ON "join_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "idx_join_request_group_status" ON "join_requests"("groupId", "status");
