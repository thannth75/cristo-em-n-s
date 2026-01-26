import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * A responsive container that provides consistent padding and max-width
 * across all screen sizes, preventing content from being hidden behind
 * system UI elements (notches, home indicators, etc.)
 */
const ResponsiveContainer = ({ children, className, noPadding }: ResponsiveContainerProps) => {
  return (
    <div
      className={cn(
        "w-full mx-auto",
        !noPadding && "px-3 sm:px-4 md:px-6",
        "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
