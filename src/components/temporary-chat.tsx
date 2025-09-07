"use client";

import { appStore } from "@/app/store";
import { useChat } from "@ai-sdk/react";
import { cn } from "lib/utils";

import { PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { Button } from "ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import PromptInput from "./prompt-input";
import { ErrorMessage, PreviewMessage } from "./message";
import { MessageCircleDashed, X } from "lucide-react";
import { Separator } from "ui/separator";
import { UIMessage } from "ai";
import { useShallow } from "zustand/shallow";
import {
  getShortcutKeyList,
  isShortcutEvent,
  Shortcuts,
} from "lib/keyboard-shortcuts";
export default function TemporaryChat({ children }: PropsWithChildren) {
  const [temporaryModel, open, appStoreMutate] = appStore(
    useShallow((state) => [
      state.temporaryModel,
      state.openTemporaryChat,
      state.mutate,
    ]),
  );

  const setOpen = (bool: boolean) => {
    appStoreMutate({ openTemporaryChat: bool });
  };

  const {
    messages,
    input,
    setInput,
    append,
    status,
    reload,
    setMessages,
    error,
    stop,
  } = (useChat as any)({
    api: "/api/chat/temporary",
    experimental_throttle: 100,
    body: {
      model: temporaryModel,
    },
    onError: () => {
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  const isLoading = useMemo(
    () => status === "streaming" || status === "submitted",
    [status],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEvent(e, Shortcuts.toggleTemporaryChat)) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!open);
      } else if (
        isShortcutEvent(e, {
          shortcut: {
            command: true,
            key: "e",
          },
        })
      ) {
        e.preventDefault();
        e.stopPropagation();
        setMessages([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <Drawer handleOnly direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {children ?? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  setOpen(!open);
                }}
                variant={"ghost"}
              >
                <MessageCircleDashed />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="end" side="bottom">
              <p className="text-xs flex items-center gap-2">
                Toggle Temporary Chat
                <span className="text-xs text-muted-foreground">
                  {getShortcutKeyList(Shortcuts.toggleTemporaryChat).join(
                    " + ",
                  )}
                </span>
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </DrawerTrigger>
      <DrawerContent
        style={{
          userSelect: "text",
        }}
        className="w-full md:w-2xl px-2 flex flex-col"
      >
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <p>Temporary Chat</p>

            <div className="flex-1" />
            <Button
              variant={"secondary"}
              className="rounded-full"
              onClick={() => setMessages([])}
              disabled={isLoading}
            >
              Reset Chat
              <Separator orientation="vertical" />
              <span className="text-xs text-muted-foreground ml-1">⌘E</span>
            </Button>
            <DrawerClose asChild>
              <Button
                variant={"secondary"}
                className="flex items-center gap-1 rounded-full"
              >
                <X />
                <Separator orientation="vertical" />
                <span className="text-xs text-muted-foreground ml-1">ESC</span>
              </Button>
            </DrawerClose>
          </DrawerTitle>
        </DrawerHeader>
        <DrawerTemporaryContent
          isLoading={isLoading}
          messages={messages}
          error={error}
          input={input}
          setInput={setInput}
          append={append}
          setMessages={setMessages}
          reload={reload}
          stop={stop}
          status={status}
        />
      </DrawerContent>
    </Drawer>
  );
}

function DrawerTemporaryContent({
  messages,
  input,
  setInput,
  append,
  status,
  error,
  isLoading,
  setMessages,
  reload,
  stop,
}: {
  messages: UIMessage[];
  input: string;
  setInput: (input: string) => void;
  append: (message: any, options?: any) => Promise<any>;
  status: any;
  isLoading: boolean;
  error: Error | undefined;
  setMessages: (updater: any) => void;
  reload: (opts?: any) => any;
  stop: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const autoScrollRef = useRef(false);

  const [temporaryModel, appStoreMutate] = appStore(
    useShallow((state) => [state.temporaryModel, state.mutate]),
  );

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current?.scrollHeight,
    });
  }, []);

  useEffect(() => {
    if (autoScrollRef.current) {
      containerRef.current?.scrollTo({
        top: containerRef.current?.scrollHeight,
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      autoScrollRef.current = true;
      const handleScroll = () => {
        const el = containerRef.current!;
        const isAtBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight < 20;
        if (!isAtBottom) {
          autoScrollRef.current = false;
        }
      };
      containerRef.current?.addEventListener("scroll", handleScroll);
      return () => {
        containerRef.current?.removeEventListener("scroll", handleScroll);
      };
    }
  }, [isLoading]);

  return (
    <div
      className={cn("flex flex-col min-w-0 h-full flex-1 overflow-y-hidden")}
    >
      {!messages.length && (
        <div className="flex-1 items-center flex">
          <div className="max-w-3xl mx-auto my-4">
            {" "}
            <div className="rounded-xl p-6 flex flex-col gap-2 leading-relaxed text-center">
              <h1 className="text-4xl font-semibold ">
                This chat won&apos;t be saved.
              </h1>
            </div>
          </div>
        </div>
      )}
      <div
        className={"flex flex-col gap-2 overflow-y-auto py-6"}
        ref={containerRef}
      >
        {messages.map((message, index) => {
          const isLastMessage = messages.length - 1 === index;
          return (
            <PreviewMessage
              messageIndex={index}
              key={index}
              message={message}
              status={status}
              isLoading={isLoading}
              isLastMessage={isLastMessage}
              setMessages={setMessages}
              reload={reload}
            />
          );
        })}
        {error && <ErrorMessage error={error} />}
      </div>

      <div className={"w-full my-6 mt-auto"}>
        <PromptInput
          input={input}
          append={append}
          model={temporaryModel}
          setModel={(model) => {
            appStoreMutate({ temporaryModel: model });
          }}
          toolDisabled
          placeholder="Feel free to ask anything temporarily"
          setInput={setInput}
          voiceDisabled
          isLoading={isLoading}
          onStop={stop}
        />
      </div>
    </div>
  );
}
