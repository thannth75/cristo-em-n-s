import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * A responsive container that provides consistent padding and max-width
 * across all screen sizes, preventing content from being hidden behind
 * system UI elements (notches, home indicators, etc.)
 */
const ResponsiveContainer = ({ 
  children, 
  className, 
  noPadding,
  size = "lg" 
}: ResponsiveContainerProps) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-7xl",
  };

  return (
    <div
      className={cn(
        "w-full mx-auto",
        !noPadding && "px-4 sm:px-6",
        sizeClasses[size],
        className
      )}
      style={{
        paddingLeft: noPadding ? undefined : 'max(1rem, env(safe-area-inset-left, 16px))',
        paddingRight: noPadding ? undefined : 'max(1rem, env(safe-area-inset-right, 16px))',
      }}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
