"use client";

import { ToolUIPart } from "ai";
import { ExaSearchResponse } from "@/lib/ai/tools/web-search";
import { cn } from "@/lib/utils";
import { AlertTriangleIcon, Globe } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { JsonViewPopup } from "../json-view-popup";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface WebSearchToolInvocationProps {
  part: ToolUIPart;
}

function PureWebSearchToolInvocation({ part }: WebSearchToolInvocationProps) {
  console.log('[DEBUG] WebSearchToolInvocation - part:', part);
  const result = useMemo(() => {
    if (!part.state || !part.state.startsWith("output")) return null;
    
    // Handle Tavily MCP tool results
    if (part.toolName?.includes("tavily-search")) {
      const tavilyResult = part.output as any;
      console.log('[DEBUG] Tavily raw result:', JSON.stringify(tavilyResult, null, 2));
      if (tavilyResult?.content?.[0]?.text) {
        // Parse Tavily's text format into Exa-like results
        const text = tavilyResult.content[0].text;
        const results = [];
        
        // Extract Title and URL pairs from Tavily format
        const matches = text.matchAll(/Title: (.+?)\nURL: (.+?)\nContent: (.+?)(?=\n\nTitle:|$)/gs);
        for (const match of matches) {
          results.push({
            id: match[2],
            title: match[1],
            url: match[2], 
            text: match[3].substring(0, 500), // Truncate content
            publishedDate: "",
            author: "",
            score: 1,
            image: null,
            favicon: null
          });
        }
        
        // Check if Tavily provided images in other parts of the response
        let images = [];
        if (tavilyResult.images) {
          images = tavilyResult.images;
          console.log('[DEBUG] Tavily images found:', images);
        }
        
        // If images exist, try to associate them with results
        if (images.length > 0 && results.length > 0) {
          results.forEach((result, index) => {
            if (images[index]) {
              result.image = images[index];
            }
          });
        }
        
        return {
          results,
          requestId: "tavily-" + Date.now(),
          resolvedSearchType: "tavily",
          searchTime: 0
        };
      }
    }
    
    // Handle Exa results
    return part.output as ExaSearchResponse & {
      isError: boolean;
      error?: string;
    };
  }, [part.state, part.toolName, part.output]);
  
  const [errorSrc, setErrorSrc] = useState<string[]>([]);

  const options = useMemo(() => {
    return (
      <HoverCard openDelay={200} closeDelay={0}>
        <HoverCardTrigger asChild>
          <span className="hover:text-primary transition-colors text-xs text-muted-foreground">
            Search options
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="max-w-xs md:max-w-md! w-full! overflow-auto flex flex-col">
          <p className="text-xs text-muted-foreground px-2 mb-2">
            Search parameters used for this query
          </p>
          <div className="p-2">
            <JsonViewPopup data={part.input} />
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }, [part.input]);

  const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (errorSrc.includes(target.src)) return;
    setErrorSrc([...errorSrc, target.src]);
  };

  const images = useMemo(() => {
    // Exa doesn't provide separate images array, but individual results may have image property
    return (
      result?.results
        ?.filter((r) => {
          if (!r.image || errorSrc.includes(r.image)) return false;
          // Filter out relative URLs and invalid URLs
          try {
            new URL(r.image);
            return r.image.startsWith('http://') || r.image.startsWith('https://');
          } catch {
            return false;
          }
        })
        .map((r) => ({ url: r.image!, description: r.title })) ?? []
    );
  }, [result?.results, errorSrc]);

  if (!part.state.startsWith("output"))
    return (
      <div className="flex items-center gap-2 text-sm">
        <Globe className="size-5 animate-pulse text-muted-foreground" />
        <span className="text-muted-foreground">Searching the web...</span>
      </div>
    );
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Globe className="size-5 text-muted-foreground" />
        <span className="text-sm font-semibold">
          Searched the web
        </span>
        {options}
      </div>
      <div className="flex gap-2">
        <div className="px-2.5">
          <Separator
            orientation="vertical"
            className="bg-gradient-to-b from-border to-transparent from-80%"
          />
        </div>
        <div className="flex flex-col gap-2 pb-2">
          {Boolean(images?.length) && (
            <div className="grid grid-cols-3 gap-3 max-w-2xl">
              {images.map((image, i) => {
                if (!image.url) return null;
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div
                        key={image.url}
                        onClick={() => {
                          toast.custom((t) => (
                            <div className="max-w-[90vw] max-h-[90vh] p-6 bg-background border rounded-lg shadow-lg">
                              <div className="flex flex-col h-full gap-4">
                                <div className="flex-1 flex items-center justify-center min-h-0 py-6">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={image.url}
                                    className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg"
                                    alt={image.description}
                                    onError={onError}
                                  />
                                </div>
                              </div>
                            </div>
                          ));
                        }}
                        className="block shadow rounded-lg overflow-hidden ring ring-input cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          loading="lazy"
                          src={image.url}
                          alt={image.description}
                          className="w-full h-36 object-cover hover:scale-120 transition-transform duration-300"
                          onError={onError}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 max-w-xs whitespace-pre-wrap break-words">
                      <p className="text-xs text-muted-foreground">
                        {image.description || image.url}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {result?.isError ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangleIcon className="size-3.5" />
                {result.error || "Error"}
              </p>
            ) : (
              (result as ExaSearchResponse)?.results?.map((result, i) => {
                return (
                  <HoverCard key={i} openDelay={200} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-full bg-secondary pl-1.5 pr-2 py-1.5 text-xs flex items-center gap-1 hover:bg-input hover:ring hover:ring-blue-500 transition-all cursor-pointer"
                      >
                        <div className="rounded-full bg-input ring ring-input">
                          <Avatar className="size-3 rounded-full">
                            <AvatarImage src={result.favicon} />
                            <AvatarFallback>
                              {result.title?.slice(0, 1).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="truncate max-w-44">{result.url}</span>
                      </a>
                    </HoverCardTrigger>

                    <HoverCardContent className="flex flex-col gap-1 p-6">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full ring ring-input">
                          <Avatar className="size-6 rounded-full">
                            <AvatarImage src={result.favicon} />
                            <AvatarFallback>
                              {result.title?.slice(0, 1).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span
                          className={cn(
                            "font-medium",
                            !result.title && "truncate",
                          )}
                        >
                          {result.title || result.url}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 mt-4">
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-card from-80% " />
                          <p className="text-xs text-muted-foreground max-h-60 overflow-y-auto">
                            {result.text}
                          </p>
                        </div>
                        {result.author && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">Author:</span>{" "}
                            {result.author}
                          </div>
                        )}
                        {result.publishedDate && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Published:</span>{" "}
                            {new Date(
                              result.publishedDate,
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })
            )}
          </div>
          {result?.results?.length && (
            <p className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
              {result?.results?.length} results found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function areEqual(
  { part: prevPart }: WebSearchToolInvocationProps,
  { part: nextPart }: WebSearchToolInvocationProps,
) {
  if (prevPart.state != nextPart.state) return false;
  if (JSON.stringify(prevPart.input) !== JSON.stringify(nextPart.input)) return false;
  if (
    prevPart.state.startsWith("output") &&
    JSON.stringify(prevPart.output) !== JSON.stringify(nextPart.output)
  )
    return false;
  return true;
}

export const WebSearchToolInvocation = memo(
  PureWebSearchToolInvocation,
  areEqual,
);