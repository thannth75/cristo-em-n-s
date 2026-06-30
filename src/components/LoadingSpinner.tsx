import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

const LoadingSpinner = ({
  className,
  size = "md",
  fullPage = false,
}: LoadingSpinnerProps) => {
  const spinner = (
    <div
      className={cn(
        "animate-spin rounded-full border-4 border-primary border-t-transparent",
        sizeClasses[size],
        className,
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
