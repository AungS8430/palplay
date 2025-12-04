"use client";

import { useState, useEffect, useContext } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Reply, EllipsisVertical, Trash } from "lucide-react";
import SpotifyEmbed from "@/components/app/embeds/spotify";
import YouTubeEmbed from "@/components/app/embeds/youtube";
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
  const { replyingTo, setReplyingTo } = context || {};

  useEffect(() => {
    if (replyToId) {
      fetch(`/api/v1/groups/${groupId}/messages/${replyToId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(res => res.json())
        .then(data => setReplyPreview(data.text))
        .catch(error => console.error("Error fetching replied message:", error));
    }
  }, [replyToId, groupId]);

  if (!memberDataProp) {
    return <></>;
  }

  return (
    <div className={"flex flex-row gap-2 items-end " + (out ? " justify-end" : " justify-start")}>
      {
        !out && (
          <Avatar className="w-9 h-9 order-first">
            <AvatarImage src={memberDataProp.user.name} />
            <AvatarFallback>{memberDataProp.user.name.split(/[^A-Za-z]/)[0][0]}{(memberDataProp.user.name.split(/[^A-Za-z]/)?.length && memberDataProp.user.name.split(/[^A-Za-z]/)?.length || 0 > 1) && memberDataProp.user.name.split(/[^A-Za-z]/)[1][0]}</AvatarFallback>
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
              (out || memberDataProp.member.role == "owner" || memberDataProp.member.role == "admin") && <DropdownMenuItem><Trash />Delete Message</DropdownMenuItem>
            }
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="icon-sm"
          variant="ghost"
          className="rounded-full"
          onClick={() => {
            setReplyingTo && setReplyingTo({
              messageId: messageId || null,
              messageText: text,
              memberData: memberDataProp,
              spotifyUri: spotifyUri || null,
              youtubeId: youtubeId || null,
              out: out,
            })
          }}
        >
          <Reply className="text-neutral-400" />
        </Button>
      </div>
    </div>
  )
}