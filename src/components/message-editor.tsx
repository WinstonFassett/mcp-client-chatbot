"use client";

import { deleteTrailingMessages } from "@/app/(chat)/actions";
import type { UIMessage } from "ai";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

// Minimal UIMessage shape is provided by ai's UIMessage.

export type MessageEditorProps = {
  message: UIMessage;
  setMode: Dispatch<SetStateAction<"view" | "edit">>;
  setMessages?: (updater: any) => void;
  reload?: () => void;
};

export function MessageEditor({
  message,
  setMode,
  setMessages,
  reload,
}: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draftContent, setDraftContent] = useState(
    (message.parts?.find((p) => p.type === "text") as { text: string } | undefined)?.text ||
      "",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      await deleteTrailingMessages({
        id: message.id,
      });

      if (setMessages) {
        setMessages((messages: UIMessage[]) => {
          const index = messages.findIndex((m) => m.id === message.id);

          if (index !== -1) {
            const updatedMessage: UIMessage = {
              ...message,
              parts: [{ type: "text", text: draftContent }],
            };

            return [...messages.slice(0, index), updatedMessage];
          }

          return messages;
        });
      }

      setMode("view");
      if (reload) reload();
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        data-testid="message-editor"
        ref={textareaRef}
        className="bg-transparent outline-none overflow-hidden resize-none !text-base rounded-xl w-full"
        value={draftContent}
        onChange={handleInput}
      />

      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          onClick={() => {
            setMode("view");
          }}
        >
          Cancel
        </Button>
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isSubmitting}
          onClick={handleSave}
        >
          {isSubmitting ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
