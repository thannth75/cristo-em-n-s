import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import GlowOrb from "@/components/GlowOrb";

interface PageWrapperProps {
  children: ReactNode;
  userName?: string;
  showGlowOrb?: boolean;
  className?: string;
  noPadding?: boolean;
}

/**
 * A wrapper component that provides consistent page layout with:
 * - Header
 * - Bottom navigation with safe area
 * - Optional glow orb decoration
 * - Proper padding to prevent content overlap
 */
const PageWrapper = ({
  children,
  userName = "Jovem",
  showGlowOrb = false,
  className,
  noPadding = false,
}: PageWrapperProps) => {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {showGlowOrb && (
        <GlowOrb className="absolute -top-20 -right-20 h-64 w-64 opacity-30" />
      )}
      
      <AppHeader userName={userName} />

      <main
        className={cn(
          "relative z-10",
          // Bottom padding accounts for navigation + safe area
          "pb-[calc(5rem+max(1rem,env(safe-area-inset-bottom,16px)))]",
          // Minimum height accounting for header
          "min-h-[calc(100vh-4rem)]",
          !noPadding && "pt-2",
          className
        )}
      >
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default PageWrapper;
