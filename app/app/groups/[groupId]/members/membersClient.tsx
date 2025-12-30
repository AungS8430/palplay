"use client";

import { useState } from "react";
import { useRealtimeGroupMembers } from "@/lib/realtime";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreVertical, Shield, ShieldCheck, Crown, UserMinus, ArrowRightLeft, Loader2 } from "lucide-react";

type MemberWithUser = {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

interface MembersClientProps {
  groupId: string;
  currentUserId: string;
}

export default function MembersClient({ groupId, currentUserId }: MembersClientProps) {
  const { members, connected } = useRealtimeGroupMembers(groupId);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "remove" | "transfer" | "role";
    member: MemberWithUser | null;
    newRole?: string;
  }>({ open: false, type: "remove", member: null });

  const currentMember = members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin";
  const canManage = isOwner || isAdmin;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
            <Crown className="h-3 w-3" />
            Owner
          </span>
        );
      case "admin":
        return (
          <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs bg-neutral-700/50 text-neutral-400 px-2 py-0.5 rounded-full">
            <Shield className="h-3 w-3" />
            Member
          </span>
        );
    }
  };

  const handleUpdateRole = async (memberId: string, userId: string, newRole: string) => {
    setIsLoading(memberId);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    } finally {
      setIsLoading(null);
      setConfirmDialog({ open: false, type: "role", member: null });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setIsLoading(userId);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    } finally {
      setIsLoading(null);
      setConfirmDialog({ open: false, type: "remove", member: null });
    }
  };

  const handleTransferOwnership = async (userId: string) => {
    setIsLoading(userId);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/members/${userId}/transfer-ownership`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to transfer ownership");
      }
    } catch (error) {
      console.error("Error transferring ownership:", error);
      alert("Failed to transfer ownership");
    } finally {
      setIsLoading(null);
      setConfirmDialog({ open: false, type: "transfer", member: null });
    }
  };

  const openConfirmDialog = (type: "remove" | "transfer" | "role", member: MemberWithUser, newRole?: string) => {
    setConfirmDialog({ open: true, type, member, newRole });
  };

  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
    return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
  });

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-100">Members</h2>
        <p className="text-sm text-neutral-400">{members.length} member{members.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-2">
        {sortedMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg border border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.user?.image || undefined} alt={member.user?.name || "User"} />
                <AvatarFallback className="bg-neutral-700 text-neutral-300">
                  {member.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-100">
                    {member.user?.name || "Unknown User"}
                  </span>
                  {member.userId === currentUserId && (
                    <span className="text-xs text-neutral-500">(you)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(member.role)}
                </div>
              </div>
            </div>

            {canManage && member.userId !== currentUserId && member.role !== "owner" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-neutral-200"
                    disabled={isLoading === member.id}
                  >
                    {isLoading === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isOwner && (
                    <>
                      {member.role === "admin" ? (
                        <DropdownMenuItem
                          onClick={() => openConfirmDialog("role", member, "member")}
                          className="cursor-pointer"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Remove Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => openConfirmDialog("role", member, "admin")}
                          className="cursor-pointer"
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => openConfirmDialog("transfer", member)}
                        className="cursor-pointer"
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transfer Ownership
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => openConfirmDialog("remove", member)}
                    className="cursor-pointer text-red-400 focus:text-red-400"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove from Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-100">
              {confirmDialog.type === "remove" && "Remove Member"}
              {confirmDialog.type === "transfer" && "Transfer Ownership"}
              {confirmDialog.type === "role" && (confirmDialog.newRole === "admin" ? "Make Admin" : "Remove Admin")}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {confirmDialog.type === "remove" && (
                <>
                  Are you sure you want to remove <span className="font-medium text-neutral-200">{confirmDialog.member?.user?.name}</span> from this group?
                  They will need a new invite to rejoin.
                </>
              )}
              {confirmDialog.type === "transfer" && (
                <>
                  Are you sure you want to transfer ownership to <span className="font-medium text-neutral-200">{confirmDialog.member?.user?.name}</span>?
                  You will become an admin and they will become the owner.
                </>
              )}
              {confirmDialog.type === "role" && confirmDialog.newRole === "admin" && (
                <>
                  Make <span className="font-medium text-neutral-200">{confirmDialog.member?.user?.name}</span> an admin?
                  They will be able to manage members.
                </>
              )}
              {confirmDialog.type === "role" && confirmDialog.newRole === "member" && (
                <>
                  Remove admin privileges from <span className="font-medium text-neutral-200">{confirmDialog.member?.user?.name}</span>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              className="text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === "remove" ? "destructive" : "default"}
              onClick={() => {
                if (!confirmDialog.member) return;
                if (confirmDialog.type === "remove") {
                  handleRemoveMember(confirmDialog.member.userId);
                } else if (confirmDialog.type === "transfer") {
                  handleTransferOwnership(confirmDialog.member.userId);
                } else if (confirmDialog.type === "role" && confirmDialog.newRole) {
                  handleUpdateRole(confirmDialog.member.id, confirmDialog.member.userId, confirmDialog.newRole);
                }
              }}
              disabled={isLoading !== null}
            >
              {isLoading !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmDialog.type === "remove" && "Remove"}
              {confirmDialog.type === "transfer" && "Transfer"}
              {confirmDialog.type === "role" && "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

