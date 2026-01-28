import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import ReactMarkdown from "react-markdown";

interface AIAssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "general" | "diary" | "question" | "encouragement";
  context?: Record<string, string>;
  initialMessage?: string;
}

const AIAssistantChat = ({
  isOpen,
  onClose,
  type = "general",
  context,
  initialMessage,
}: AIAssistantChatProps) => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIAssistant({
    type,
    context,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Send initial message if provided
  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      sendMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "O que a Bíblia diz sobre ansiedade?",
    "Como posso fortalecer minha fé?",
    "Me ajude a entender Romanos 8:28",
    "Preciso de encorajamento hoje",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-lg h-[85vh] sm:h-[600px] bg-background rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Vida em Cristo AI</h3>
                  <p className="text-xs text-muted-foreground">Seu assistente espiritual</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearMessages}
                    className="rounded-xl h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-xl h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Olá! Sou a IA do Vida em Cristo
                  </h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Posso ajudar com dúvidas bíblicas, reflexões espirituais e palavras de
                    encorajamento.
                  </p>
                  <div className="grid gap-2 w-full">
                    {suggestedQuestions.map((question, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(question)}
                        className="text-left p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm text-foreground"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-md"
                            : "bg-muted rounded-tl-md"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Pensando...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
                  {error}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background pb-safe">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua pergunta..."
                  className="min-h-[44px] max-h-[120px] rounded-xl resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-11 w-11 rounded-xl shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantChat;
