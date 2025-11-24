"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Music } from "lucide-react";

export default function MessageField() {
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <form className="flex flex-row w-full gap-2">
      <Button type="button" size="icon" variant="secondary"><Music /></Button>
      <Textarea rows={1} className="resize-none overflow-hidden min-h-auto! grow" placeholder="Type your message here..." onInput={handleInput} />
      <Button type="submit" size="icon"><Send /></Button>
    </form>
  )
}