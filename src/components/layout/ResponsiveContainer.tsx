import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ children, className, noPadding, size = "lg" }, ref) => {
    const sizeClasses = {
      sm: "max-w-md",
      md: "max-w-2xl",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      full: "max-w-7xl",
    };

    return (
      <div
        ref={ref}
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
  }
);

ResponsiveContainer.displayName = "ResponsiveContainer";

export default ResponsiveContainer;
