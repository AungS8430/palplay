"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  replyingTo: any;
  setReplyingTo: (message: any) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode })  {
  const [replyingTo, setReplyingTo] = useState<any>(null);

  return (
    <ChatContext.Provider value={{ replyingTo, setReplyingTo }}>
      {children}
    </ChatContext.Provider>
  );
}