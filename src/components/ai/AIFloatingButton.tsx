import { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import AIAssistantChat from "./AIAssistantChat";

interface AIFloatingButtonProps {
  type?: "general" | "diary" | "question" | "encouragement";
  context?: Record<string, string>;
}

const AIFloatingButton = forwardRef<HTMLDivElement, AIFloatingButtonProps>(
  function AIFloatingButton({ type = "general", context }, ref) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div ref={ref}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
          style={{
            bottom: "calc(6rem + max(0.5rem, env(safe-area-inset-bottom, 8px)))",
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bot className="h-6 w-6" />
          </motion.div>
          
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </motion.div>
        </motion.button>

        <AIAssistantChat
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          type={type}
          context={context}
        />
      </div>
    );
  }
);

export default AIFloatingButton;
