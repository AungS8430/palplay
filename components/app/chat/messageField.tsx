"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Send, Music, CircleX } from "lucide-react";

interface Track {
  title: string;
  spotifyUri: string;
  artist: string;
  album: string;
  coverUrl: string;
}

export default function MessageField({ groupId }: { groupId: string }) {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Array<any>>([]);
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [selectOpen , setSelectOpen] = useState(false);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
    setMessage(target.value);
  };

  useEffect(() => {
    if (search.length === 0) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/v1/songs/search?q=${encodeURIComponent(search)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (response.ok) {
          const data = await response.json();
          setResults(data || []);
        } else {
          console.error("Error fetching search results:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    fetchResults();
  }, [search]);

  function handleSelectTrack(track: Track) {
    setCurrentSong(track);
    setSearch("");
    setResults([]);
    setSelectOpen(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log("Submitting message:", { message, currentSong });
    e.preventDefault();
    if (!message || message.trim().length === 0) return;

    fetch(`/api/v1/groups/${groupId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
        spotifyUri: currentSong ? currentSong.spotifyUri : null,
      }),
    })
  }
  return (
    <form className="flex flex-row w-full gap-2" onSubmit={handleSubmit}>
      <Popover open={selectOpen} onOpenChange={setSelectOpen}>
        <ButtonGroup>
          <PopoverTrigger asChild>
            <Button type="button" size={currentSong ? "default" : "icon"} variant="secondary"><Music />{currentSong && ` ${currentSong.title.substring(0, 20)}${currentSong.title.length > 20 ? "..." : ""}`}</Button>
          </PopoverTrigger>
          {currentSong && (
            <Button size="icon" variant="secondary" onClick={() => setCurrentSong(null)}><CircleX /></Button>
          )}
        </ButtonGroup>

        <PopoverContent align="start">
          <div className="flex flex-col gap-2">
            <p className="text-sm">Add a song</p>
            <Input type="text" placeholder="Search a song..." onChange={(e) => setSearch(e.target.value)} value={search} />
            <div className="max-h-48 overflow-y-scroll flex flex-col gap-2">
              {
                results.length === 0 ? (
                  <p className="text-sm text-neutral-500">No results</p>
                ) : (
                  results.map((track: Track) => (
                    <div key={track.spotifyUri} className="flex flex-row items-center gap-2 p-2 hover:bg-neutral-800 transition-colors rounded-md cursor-pointer" onClick={() => handleSelectTrack(track)}>
                      <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded-md" />
                      <div className="flex flex-col overflow-hidden">
                        <p className="text-sm text-ellipsis">{track.title}</p>
                        <p className="text-xs text-neutral-500 text-ellipsis">{track.artist} - {track.album}</p>
                      </div>
                    </div>
                  ))
                )
              }
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Textarea rows={1} className="resize-none overflow-hidden min-h-auto! grow" placeholder="Type your message here..." onInput={handleInput} value={message} />
      <Button type="submit" size="icon"><Send /></Button>
    </form>
  )
}