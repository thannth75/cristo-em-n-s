import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backPath?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, showBack = false, backPath, children }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-3 sm:px-4 md:px-6 py-2 sm:py-3 backdrop-blur-xl pt-safe">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="font-serif text-lg sm:text-xl font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {children}
          <NotificationCenter />
        </div>
      </div>
    </header>
  );
}
