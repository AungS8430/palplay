"use client";

import { useRealtimeGroupInfo } from "@/lib/realtime";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import { Trash, LogOut, EllipsisVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export default function Group({ groupId, role }: { groupId: string, role: string }) {
  const { groupInfo, connected } = useRealtimeGroupInfo(groupId);
  const [confirmation, setConfirmation] = useState("");
  const [confirmationError, setConfirmationError] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const [error, setError] = useState(null);

  function handleDeleteGroup(e: React.FormEvent) {
    e.preventDefault();
    if (role !== "owner") return;
    if (confirmation !== groupInfo?.name) {
      return;
    }
    const response = fetch(`/api/v1/groups/${groupId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.ok) {
        setDialogOpen(false);
      } else {
        setError(res.body && (await res.json()).error ? (await res.json()).error : "Failed to delete group");
        setErrorDialogOpen(true);
      }
    })
  }

  function handleLeaveGroup() {
    if (role === "owner") return;
    const response = fetch(`api/v1/groups/${groupId}/members`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.ok) {
        setDialogOpen(false);
      } else {
        setError(res.body && (await res.json()).error ? (await res.json()).error : "Failed to leave group");
        setErrorDialogOpen(true);
      }
    })
  }

  useEffect(() => {
    setConfirmationError(confirmation !== "" && confirmation !== groupInfo?.name);
  }, [confirmation]);

  useEffect(() => {
    if (!dialogOpen && !errorDialogOpen) {
      setConfirmation("");
      setConfirmationError(false);
      setError(null);
    }
  }, [dialogOpen, errorDialogOpen]);

  return (
    (
      connected ? (
        <div className="flex flex-row items-center gap-1">
          <SidebarMenuButton size="lg">
            <Avatar>
              <AvatarImage src={undefined} alt={groupId} />
              <AvatarFallback>{groupInfo?.name?.split(/[^A-Za-z]/)[0][0]}{(groupInfo?.name?.split(/[^A-Za-z]/)?.length && groupInfo?.name?.split(/[^A-Za-z]/)?.length > 1) && groupInfo?.name?.split(/[^A-Za-z]/)[1][0]}</AvatarFallback>
            </Avatar>
            <p className="truncate font-medium text-neutral-300">{groupInfo?.name ?? "User"}</p>
          </SidebarMenuButton>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{groupInfo?.name ?? "Group"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {
                    role === "owner" ? (
                      <>
                        <DialogTrigger asChild>
                          <DropdownMenuItem>
                            <Trash />
                            Delete Group
                          </DropdownMenuItem>
                        </DialogTrigger>
                      </>
                    ) : (
                      <>
                        <DialogTrigger asChild>
                          <DropdownMenuItem>
                            <LogOut />
                            Leave Group
                          </DropdownMenuItem>
                        </DialogTrigger>

                      </>
                    )
                  }
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {
              role === "owner" ? (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Group</DialogTitle>
                    <DialogDescription>Are you sure you want to delete <span className="font-bold text-neutral-300">{groupInfo?.name}</span>? This action can't be undone.<br />Type <span className="font-bold text-neutral-300">{groupInfo?.name}</span> to confirm.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDeleteGroup}>
                    <FieldSet>
                      <FieldGroup>
                        <Field>
                          <FieldLabel>Group Name</FieldLabel>
                          <Input id="group-name" placeholder={groupInfo?.name ?? "Group Name"} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required aria-invalid={confirmationError} />
                          {
                            confirmationError && (<FieldError>Group name doesn't match</FieldError>)
                          }
                          <FieldDescription>Type the group name to confirm deletion</FieldDescription>
                        </Field>
                        <Field>
                          <Button type="submit" variant="destructive">Confirm Delete</Button>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </form>
                </DialogContent>
              ) : (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Leave Group</DialogTitle>
                    <DialogDescription>Are you sure you want to leave <span className="font-bold text-neutral-300">{groupInfo?.name}</span>? You can rejoin later if you have an invite link.</DialogDescription>
                  </DialogHeader>
                  <Button variant="destructive" onClick={handleLeaveGroup}>Confirm Leave</Button>
                </DialogContent>
              )
            }
          </Dialog>
          <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Error</DialogTitle>
                <DialogDescription>
                  {error}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-1">
          <SidebarMenuButton size="lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </SidebarMenuButton>
          <Skeleton className="h-8 w-8 square rounded" />
        </div>
      )
    )
  )
}