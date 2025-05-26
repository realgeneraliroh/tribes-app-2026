"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, User, HelpCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { suggestThreadsForMood } from '@/ai/flows/mood-based-content-suggestions';
import { summarizeTribeActivity } from '@/ai/flows/summarize-tribe-activity';

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  suggestions?: string[];
  reasoning?: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    // In a real app, you'd call your AI backend here.
    // Example: Check for keywords to trigger specific AI flows
    let aiResponseText = "I'm processing your request...";
    let suggestions: string[] | undefined = undefined;
    let reasoning: string | undefined = undefined;

    try {
      if (inputValue.toLowerCase().includes("suggest threads for mood")) {
        // Example input for mood-based suggestions
        const moodResult = await suggestThreadsForMood({
          currentMood: "curious", // This could be dynamic
          tribeThreads: ["Latest Tech News", "Book Club Discussions", "Weekend Hiking Plans", "AI in Art"],
          userInterests: ["technology", "AI", "reading"]
        });
        aiResponseText = `Here are some threads you might like based on a 'curious' mood and your interests:`;
        suggestions = moodResult.suggestedThreads;
        reasoning = moodResult.reasoning;

      } else if (inputValue.toLowerCase().includes("summarize activity for tribe")) {
        // Example input for activity summary
        const summaryResult = await summarizeTribeActivity({
          tribeName: "Tech Explorers", // This could be dynamic
          recentActivity: "John posted about a new AI model. Alice shared a link to a Genkit tutorial. Bob asked about Next.js 15 features."
        });
        aiResponseText = `Here's a summary for Tech Explorers:\n${summaryResult.summary}`;
      } else {
         await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
         aiResponseText = `Thanks for your message: "${userMessage.text}". How can I assist you further today? You can ask me to 'suggest threads for mood' or 'summarize activity for tribe [Tribe Name]'.`;
      }
    } catch (error) {
      console.error("AI flow error:", error);
      aiResponseText = "Sorry, I encountered an error trying to process that. Please try again.";
    }


    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: aiResponseText,
      sender: "ai",
      timestamp: new Date(),
      suggestions,
      reasoning,
    };
    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };
  
  const quickActions = [
    { label: "Suggest threads for 'inspired' mood", query: "Suggest threads for mood inspired" },
    { label: "Summarize 'Tech News' tribe", query: "Summarize activity for tribe Tech News" },
    { label: "How do I create a new tribe?", query: "How do I create a new tribe?" },
  ];


  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem)-2rem)] items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-3xl h-full flex flex-col shadow-2xl">
        <CardHeader className="border-b p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src="https://placehold.co/100x100.png?text=AI" alt="AI Assistant" data-ai-hint="robot bot" />
              <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl font-mono text-foreground">AI Assistant</CardTitle>
              <p className="text-sm text-muted-foreground">Your friendly helper for Tribes.app</p>
            </div>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1 p-2 sm:p-4" ref={scrollAreaRef}>
          <CardContent className="space-y-4 ">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <HelpCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="font-semibold">Welcome to your AI Assistant!</p>
                <p>Ask me anything about Tribes.app, or try one of the suggestions below.</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end space-x-2 max-w-[85%]",
                  message.sender === "user" ? "ml-auto justify-end" : "mr-auto justify-start"
                )}
              >
                {message.sender === "ai" && (
                  <Avatar className="h-8 w-8 self-start">
                    <AvatarImage src="https://placehold.co/40x40.png?text=AI" alt="AI" data-ai-hint="robot bot" />
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-xl p-3 shadow-md text-sm",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card text-card-foreground border rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-muted/50">
                      <p className="font-semibold text-xs mb-1">Suggested Threads:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {message.suggestions.map((s, i) => <li key={i} className="text-xs">{s}</li>)}
                      </ul>
                      {message.reasoning && <p className="text-xs italic mt-1 text-muted-foreground">{message.reasoning}</p>}
                    </div>
                  )}
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-8 w-8 self-start">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person user" />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
                <div className="flex items-end space-x-2 mr-auto justify-start max-w-[85%]">
                    <Avatar className="h-8 w-8 self-start">
                        <AvatarImage src="https://placehold.co/40x40.png?text=AI" alt="AI" data-ai-hint="robot bot" />
                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-xl p-3 shadow-md text-sm bg-card text-card-foreground border rounded-bl-none">
                        <div className="flex items-center space-x-1.5">
                            <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-pulse delay-0"></span>
                            <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-pulse delay-150"></span>
                            <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                </div>
            )}
          </CardContent>
        </ScrollArea>
         {messages.length === 0 && (
            <CardFooter className="border-t p-2 sm:p-4 flex flex-wrap gap-2 justify-center">
                 {quickActions.map(action => (
                    <Button key={action.label} variant="outline" size="sm" onClick={() => { setInputValue(action.query); setTimeout(handleSendMessage,0); }} disabled={isLoading}>
                        <Zap className="mr-2 h-3 w-3"/> {action.label}
                    </Button>
                 ))}
            </CardFooter>
        )}
        <CardFooter className="border-t p-2 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex w-full items-center space-x-2"
          >
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 text-base"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || inputValue.trim() === ""} className="bg-primary hover:bg-primary/90">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
