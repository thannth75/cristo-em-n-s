interface GlowOrbProps {
  className?: string;
}

export default function GlowOrb({ className = "" }: GlowOrbProps) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <div
        className="w-full h-full rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle at 40% 40%, hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.2) 50%, transparent 70%)`,
          filter: "blur(8px)",
        }}
      />
    </div>
  );
}
