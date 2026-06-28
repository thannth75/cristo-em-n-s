import { useState, useEffect, forwardRef } from "react";
import AIAssistantChat from "./AIAssistantChat";

interface AIFloatingButtonProps {
  type?: "general" | "diary" | "question" | "encouragement";
  context?: Record<string, string>;
}

/**
 * Now headless: the visible entry point moved into the BottomNavigation FAB.
 * This component only listens for the global "open-ai-assistant" event and
 * renders the chat overlay — keeping a single, modern entry point.
 */
const AIFloatingButton = forwardRef<HTMLDivElement, AIFloatingButtonProps>(
  function AIFloatingButton({ type = "general", context }, ref) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      const handler = () => setIsOpen(true);
      window.addEventListener("open-ai-assistant", handler);
      return () => window.removeEventListener("open-ai-assistant", handler);
    }, []);

    return (
      <div ref={ref}>
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
