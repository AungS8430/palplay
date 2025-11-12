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
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button";

export default function JoinGroup() {
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false)
  const [invite, setInvite] = useState("");

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function handleGetInvite(e: React.FormEvent) {
    e.preventDefault();
    const parsedInvite = invite.includes("inviteCode=") ? (new URL(invite).searchParams.get("inviteCode") || "") : invite;
    setInvite(parsedInvite);
    setOpenFormDialog(false);
    setOpenConfirmationDialog(true);
    // Call API to create group
    const response = fetch(`/api/v1/invites?${new URLSearchParams({ inviteCode: parsedInvite || "" })}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setGroupId(data.group.id);

        setGroupName(data.group.name);
        setGroupDescription(data.group.description);
        setIsPublic(data.group.isPublic);
      } else {
        setError(res.status == 404 ? "Group not found" : res.status == 400 ? "The invite code is either invalid or has expired" : "An unexpected error occurred. Please try again later.");
      }
    })
  }

  async function handleJoinGroup() {
    if (error) return;
    if (!groupId) return;

    const response = fetch(`api/v1/groups/${groupId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inviteCode: invite,
      }),
    }).then(async (res) => {
      if (res.ok) {
        setOpenConfirmationDialog(false);
        setOpenSuccessDialog(true);
      } else {
        setError(res.status == 400 ? "You are already a member of this group" : "An unexpected error occurred. Please try again later.");
      }
    })
  }

  useEffect(() => {
    if (!openFormDialog && !openConfirmationDialog && !openSuccessDialog) {
      setInvite("");
      setGroupName("");
      setGroupDescription("");
      setIsPublic(false);
      setGroupId(null);
      setError(null);
    }
  }, [openFormDialog, openConfirmationDialog, openSuccessDialog]);

  return (
    <>
      <Dialog open={openFormDialog} onOpenChange={setOpenFormDialog}>
        <DialogTrigger asChild>
          <SidebarMenuButton className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
            <Users />
            Join Group
          </SidebarMenuButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGetInvite}>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel>Invite code/link</FieldLabel>
                  <Input id="invite" placeholder="Insert your invite link here" value={invite} onChange={(e) => setInvite(e.target.value)} required />
                </Field>
                <Field>
                  <Button type="submit">Join Group</Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={openConfirmationDialog} onOpenChange={setOpenConfirmationDialog}>
        {
          error ? (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Error getting invite code</DialogTitle>
                <DialogDescription>
                  {error}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          ) : (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Joining {groupName}</DialogTitle>
                <DialogDescription>
                  {groupDescription}
                </DialogDescription>
              </DialogHeader>
              <Button onClick={handleJoinGroup}>Join Group</Button>
            </DialogContent>
          )
        }
      </Dialog>
      <Dialog open={openSuccessDialog} onOpenChange={setOpenSuccessDialog}>
        {
          error ? (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Error joining group</DialogTitle>
                <DialogDescription>
                  {error}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          ) : (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Successfully joined {groupName}!</DialogTitle>
                <DialogDescription>
                  You are now a member of this group.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          )
        }
      </Dialog>
    </>

  )
}