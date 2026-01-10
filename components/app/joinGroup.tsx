"use client";

import { useState, useEffect, useCallback } from "react";
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
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Users, Globe, Loader2, Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function JoinGroup() {
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false)
  const [invite, setInvite] = useState("");

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Public groups discovery state
  const [publicGroups, setPublicGroups] = useState<any[]>([]);
  const [isLoadingPublicGroups, setIsLoadingPublicGroups] = useState(false);
  const [publicGroupsSearch, setPublicGroupsSearch] = useState("");
  const [isRequestingJoin, setIsRequestingJoin] = useState<string | null>(null);

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
      setGroupId(null);
      setError(null);
      setPublicGroups([]);
      setPublicGroupsSearch("");
    }
  }, [openFormDialog, openConfirmationDialog, openSuccessDialog]);

  // Stable fetch function to satisfy hooks rules and avoid stale closures
  const fetchPublicGroups = useCallback(async (search?: string) => {
    setIsLoadingPublicGroups(true);
    try {
      const url = search
        ? `/api/v1/groups?search=${encodeURIComponent(search)}`
        : `/api/v1/groups`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPublicGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching public groups:", error);
    } finally {
      setIsLoadingPublicGroups(false);
    }
  }, []);

  // Fetch public groups when dialog opens
  useEffect(() => {
    if (openFormDialog) {
      fetchPublicGroups();
    }
  }, [openFormDialog, fetchPublicGroups]);

  const handleRequestJoin = async (groupIdToJoin: string) => {
    setIsRequestingJoin(groupIdToJoin);
    try {
      const response = await fetch(`/api/v1/groups/${groupIdToJoin}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "" }),
      });

      if (response.ok) {
        // Update the local state to show pending request
        setPublicGroups(prev => prev.map(g =>
          g.id === groupIdToJoin ? { ...g, hasPendingRequest: true } : g
        ));
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to request to join");
      }
    } catch (error) {
      console.error("Error requesting join:", error);
      toast.error("Failed to request to join");
    } finally {
      setIsRequestingJoin(null);
    }
  };

  // Debounced search for public groups
  useEffect(() => {
    const timer = setTimeout(() => {
      if (openFormDialog) {
        fetchPublicGroups(publicGroupsSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [publicGroupsSearch, openFormDialog, fetchPublicGroups]);

  return (
    <>
      <Dialog open={openFormDialog} onOpenChange={setOpenFormDialog}>
        <DialogTrigger asChild>
          <SidebarMenuButton className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
            <Users />
            Join Group
          </SidebarMenuButton>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join Group</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="invite" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">Invite Link</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
            <TabsContent value="invite" className="mt-4">
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
            </TabsContent>
            <TabsContent value="discover" className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search public groups..."
                  value={publicGroupsSearch}
                  onChange={(e) => setPublicGroupsSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {isLoadingPublicGroups ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                  </div>
                ) : publicGroups.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No public groups found</p>
                  </div>
                ) : (
                  publicGroups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-200 truncate">{group.name}</p>
                        <p className="text-sm text-neutral-400 truncate">{group.description || "No description"}</p>
                        <p className="text-xs text-neutral-500 mt-1">{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="ml-3 shrink-0">
                        {group.hasPendingRequest ? (
                          <Button variant="ghost" size="sm" disabled className="text-neutral-500">
                            Pending
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRequestJoin(group.id)}
                            disabled={isRequestingJoin === group.id}
                          >
                            {isRequestingJoin === group.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Request
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
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
