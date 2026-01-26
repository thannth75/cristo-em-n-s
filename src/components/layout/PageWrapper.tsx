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
}: PageWrapperProps) => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {showGlowOrb && (
        <GlowOrb className="absolute -top-20 -right-20 h-64 w-64 opacity-30" />
      )}
      
      <AppHeader userName={userName} />

      <main
        className={cn(
          "relative z-10",
          "pb-20 sm:pb-24", // Bottom padding for navigation
          "min-h-[calc(100vh-4rem)]", // Minimum height accounting for header
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
