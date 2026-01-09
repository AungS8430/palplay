"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeGroupInfo } from "@/lib/realtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, Trash2, Globe, Lock, AlertTriangle, Link2, Copy, Check } from "lucide-react";

interface SettingsClientProps {
  groupId: string;
  isOwner: boolean;
}

export default function SettingsClient({ groupId, isOwner }: SettingsClientProps) {
  const router = useRouter();
  const { groupInfo, connected } = useRealtimeGroupInfo(groupId);

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Invite link state
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Initialize form with group data when it loads
  if (groupInfo && !isInitialized) {
    setName(groupInfo.name || "");
    setDescription(groupInfo.description || "");
    setIsPublic(groupInfo.isPublic || false);
    setIsInitialized(true);
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Group name is required");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/v1/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to save settings");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== groupInfo?.name) {
      alert("Group name doesn't match");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/v1/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete group");
      } else {
        router.push("/app");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    setInviteLink(null);
    setInviteCopied(false);

    try {
      const response = await fetch(`/api/v1/groups/${groupId}/invite?expiry=7d`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        const link = `${window.location.origin}/groups/join?inviteCode=${data.invite.code}`;
        setInviteLink(link);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to generate invite link");
      }
    } catch (error) {
      console.error("Error generating invite:", error);
      alert("Failed to generate invite link");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  if (!connected || !groupInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const hasChanges =
    name !== groupInfo.name ||
    description !== (groupInfo.description || "") ||
    isPublic !== groupInfo.isPublic;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-100">Group Settings</h2>
        <p className="text-sm text-neutral-400">Manage your group's settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info Section */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800/50 p-4 space-y-4">
          <h3 className="font-medium text-neutral-100">Basic Information</h3>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-neutral-300">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="bg-neutral-800/50 border-neutral-700 text-neutral-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-neutral-300">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description (optional)"
              className="bg-neutral-800/50 border-neutral-700 text-neutral-100 min-h-[100px]"
            />
          </div>
        </div>

        {/* Visibility Section */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800/50 p-4 space-y-4">
          <h3 className="font-medium text-neutral-100">Visibility</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Globe className="h-5 w-5 text-green-400" />
                </div>
              ) : (
                <div className="p-2 bg-neutral-700/50 rounded-lg">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
              )}
              <div>
                <p className="font-medium text-neutral-100">
                  {isPublic ? "Public Group" : "Private Group"}
                </p>
                <p className="text-sm text-neutral-400">
                  {isPublic
                    ? "Anyone can discover this group and request to join"
                    : "Only people with an invite link can join"}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        {/* Invite Links Section */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800/50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-neutral-100">Invite Link</h3>
          </div>

          <p className="text-sm text-neutral-400">
            Generate an invite link to share with others. Links expire after 7 days.
          </p>

          {inviteLink ? (
            <div className="flex items-center gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="bg-neutral-800/50 border-neutral-700 text-neutral-300 font-mono text-sm"
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCopyInvite}
                className="shrink-0"
              >
                {inviteCopied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={handleGenerateInvite}
              disabled={isGeneratingInvite}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-600/30"
            >
              {isGeneratingInvite ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Generate Invite Link
            </Button>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
          {saveSuccess && (
            <span className="text-sm text-green-400">Settings saved successfully!</span>
          )}
          {hasChanges && !saveSuccess && (
            <span className="text-sm text-amber-400">You have unsaved changes</span>
          )}
        </div>

        {/* Danger Zone - Only for owners */}
        {isOwner && (
          <div className="bg-red-950/20 rounded-lg border border-red-900/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h3 className="font-medium text-red-400">Danger Zone</h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-100">Delete Group</p>
                <p className="text-sm text-neutral-400">
                  Permanently delete this group and all its data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete Group
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              This action cannot be undone. This will permanently delete the group
              <span className="font-medium text-neutral-200"> {groupInfo.name}</span>,
              including all messages, playlists, and member data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label className="text-neutral-300">
              Type <span className="font-medium text-neutral-100">{groupInfo.name}</span> to confirm
            </Label>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Enter group name"
              className="bg-neutral-800/50 border-neutral-700 text-neutral-100"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmName("");
              }}
              className="text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || deleteConfirmName !== groupInfo.name}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
