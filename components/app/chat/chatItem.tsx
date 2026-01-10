"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Reply, EllipsisVertical, Trash, Loader2 } from "lucide-react";
import ClientDateTime from "@/components/clientDateTime";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatContext } from "@/components/app/chat/chatContext";
import { toast } from "sonner"

// Cache for reply previews to avoid re-fetching
const replyPreviewCache = new Map<string, string>();

// Lazy load heavy embed components
const SpotifyEmbed = dynamic(() => import("@/components/app/embeds/spotify"), {
  loading: () => <div className="w-full h-20 bg-neutral-800 animate-pulse rounded-lg" />,
  ssr: false,
});

const YouTubeEmbed = dynamic(() => import("@/components/app/embeds/youtube"), {
  loading: () => <div className="w-full aspect-video bg-neutral-800 animate-pulse rounded-lg" />,
  ssr: false,
});

interface MemberData {
  member: any;
  user: any;
}

interface ChatItemProps {
  messageId: string;
  groupId: string;
  out: boolean;
  text: string;
  replyToId?: string;
  spotifyUri?: string;
  youtubeId?: string;
  createdAt: string;
  editedAt?: string;
  memberData?: MemberData;
}

export default function ChatItem({
  messageId,
  groupId,
  out,
  text,
  replyToId,
  spotifyUri,
  youtubeId,
  createdAt,
  editedAt,
  memberData: memberDataProp,
}: ChatItemProps) {
  const context = useContext(ChatContext);

  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(spotifyUri ? "spotify" : "youtube");
  const [isDeleting, setIsDeleting] = useState(false);
  const { replyingTo, setReplyingTo } = context || {};

  // Handle message deletion
  const handleDeleteMessage = useCallback(async () => {
    if (!messageId || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("An error occurred while deleting the message.");
    } finally {
      setIsDeleting(false);
    }
  }, [messageId, groupId, isDeleting]);

  // Memoize avatar initials calculation
  const avatarInitials = useMemo(() => {
    if (!memberDataProp?.user?.name) return '';
    const parts = memberDataProp.user.name.split(/[^A-Za-z]/);
    const first = parts[0]?.[0] || '';
    const second = parts.length > 1 ? parts[1]?.[0] || '' : '';
    return first + second;
  }, [memberDataProp?.user?.name]);

  // Memoize reply handler
  const handleReply = useCallback(() => {
    setReplyingTo && setReplyingTo({
      messageId: messageId || null,
      messageText: text,
      memberData: memberDataProp,
      spotifyUri: spotifyUri || null,
      youtubeId: youtubeId || null,
      out: out,
    });
  }, [setReplyingTo, messageId, text, memberDataProp, spotifyUri, youtubeId, out]);

  useEffect(() => {
    if (!replyToId) return;

    // Check cache first
    const cached = replyPreviewCache.get(replyToId);
    if (cached) {
      setReplyPreview(cached);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/v1/groups/${groupId}/messages/${replyToId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (data.text) {
          replyPreviewCache.set(replyToId, data.text);
          setReplyPreview(data.text);
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error("Error fetching replied message:", error);
        }
      });

    return () => controller.abort();
  }, [replyToId, groupId]);

  if (!memberDataProp) {
    return <></>;
  }

  return (
    <div className={"flex flex-row gap-2 items-end " + (out ? " justify-end" : " justify-start")}>
      {
        !out && (
          <Avatar className="w-9 h-9 order-first">
            <AvatarImage src={memberDataProp.user.image} />
            <AvatarFallback>{avatarInitials}</AvatarFallback>
          </Avatar>
        )
      }
      <div className="flex flex-col gap-1 ">
        {replyToId && (
          <div className={"text-xs italic text-neutral-300 px-4 truncate" + (out ? " text-right" : " text-left")}>
            {/* Placeholder for replied message preview */}
            <Reply className="inline-block mr-1 mb-0.5 w-3 h-3" />
            {replyPreview ? replyPreview : "Loading reply..."}
          </div>
        )}
        <div className={"py-2 px-4 rounded-2xl text-sm " + (out ? "bg-neutral-200 text-neutral-900" : "bg-neutral-900 text-neutral-200")}>
          {text}
          {
            (spotifyUri || youtubeId) && (
              <Tabs className={"mt-2 rounded-lg"} value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  {spotifyUri && <TabsTrigger value="spotify">Spotify</TabsTrigger>}
                  {youtubeId && <TabsTrigger value="youtube">YouTube</TabsTrigger>}
                </TabsList>
                {spotifyUri && (
                  <TabsContent value="spotify">
                    <div>
                      <SpotifyEmbed uri={spotifyUri} />
                    </div>
                  </TabsContent>
                )}
                {youtubeId && (
                  <TabsContent value="youtube">
                    <div className="mb-2">
                      <YouTubeEmbed videoId={youtubeId} />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )
          }
          <p className={"text-xs font-semibold " + (out ? "text-neutral-600" : "text-neutral-400")}><ClientDateTime isoString={createdAt} /> { editedAt && (<span> · Edited At <ClientDateTime isoString={editedAt} /></span>)}</p>
        </div>
      </div>
      <div className={`flex ` + (out ? "order-first flex-row" : "flex-row-reverse")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" className="rounded-full"><EllipsisVertical className="text-neutral-400" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {
              (out || memberDataProp.member.role == "owner" || memberDataProp.member.role == "admin") && (
                <DropdownMenuItem
                  onClick={handleDeleteMessage}
                  disabled={isDeleting}
                  variant="destructive"
                >
                  {isDeleting ? <Loader2 className="animate-spin" /> : <Trash />}
                  Delete Message
                </DropdownMenuItem>
              )
            }
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="icon-sm"
          variant="ghost"
          className="rounded-full"
          onClick={handleReply}
        >
          <Reply className="text-neutral-400" />
        </Button>
      </div>
    </div>
  )
}