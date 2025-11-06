"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Plus, Copy } from "lucide-react"
import { Button } from "@/components/ui/button";

export default function NewGroup() {
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [groupId, setGroupId] = useState<string | null>(null);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenFormDialog(false);
    setOpenInviteDialog(true);
    // Call API to create group
    const response = fetch("/api/v1/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: groupName,
        description: groupDescription,
        isPublic: isPublic,
      }),
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setGroupId(data.groupId);

        // Create invite link
        const inviteResponse = fetch(`/api/v1/groups/${data.groupId}/invite`, {
          method: "POST",
        }).then(async (inviteRes) => {
          if (inviteRes.ok) {
            const inviteData = await inviteRes.json();
            const inviteLink = `${window.location.origin}/groups/join?groupId=${data.groupId}&inviteCode=${inviteData.invite.code}`;
            setInvite(inviteLink);
          } else {
            setInvite("Error creating invite link. Please try again.");
          }
        })
      } else {
        setInvite("Error creating group. Please try again.");
      }
    })
  }
  return (
    <>
      <Dialog open={openFormDialog} onOpenChange={setOpenFormDialog}>
        <DialogTrigger asChild>
          <SidebarMenuButton>
            <Plus />
            Create Group
          </SidebarMenuButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGroup}>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>Group Name</FieldLabel>
                  <Input id="group-name" placeholder="My Awesome Group :)" value={groupName} onChange={(e) => setGroupName((e.target.value))} required />
                  <FieldDescription>Your group's display name</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Group Description</FieldLabel>
                  <Input id="group-description" placeholder="Put something here, or not.. idk bro" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} />
                  <FieldDescription>A short description about your group</FieldDescription>
                </Field>
                <Field>
                  <div className="flex items-center space-x-2">
                    <Switch checked={isPublic} onCheckedChange={(checked) => setIsPublic(Boolean(checked))} />
                    <Label>Public Group</Label>
                  </div>
                  <FieldDescription>If enabled, anyone can join this group without an approval</FieldDescription>
                </Field>
                <Field>
                  <Button type="submit">Create Group</Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>

        </DialogContent>
      </Dialog>
      <Dialog open={openInviteDialog} onOpenChange={setOpenInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Link</DialogTitle>
            <DialogDescription>
              Share this link to invite others to your group:
            </DialogDescription>
            {
              invite ? (
                <div className="flex flex-row gap-1.5">
                  <Input disabled className="truncate" value={invite} />
                  <Button onClick={handleCreateGroup} size="icon"><Copy /></Button>
                </div>
              ) : (
                <></>
              )
            }
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>

  )
}