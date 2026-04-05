import { useMemo, forwardRef } from "react";

const ParallaxBackground = forwardRef<HTMLDivElement>((_props, ref) => {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        top: `${8 + Math.random() * 84}%`,
        left: `${5 + Math.random() * 90}%`,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 8,
        duration: 4 + Math.random() * 4,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    []
  );

  return (
    <div
      ref={ref}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Top glow */}
      <div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[60%] rounded-full blur-[100px]"
        style={{
          background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.04) 35%, transparent 65%)`,
        }}
      />

      {/* Bottom glow */}
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[45%] rounded-full blur-[80px]"
        style={{
          background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 55%)`,
        }}
      />

      {/* Static crosses */}
      {[
        { top: "10%", left: "10%", w: 10, h: 16, opacity: 0.08 },
        { top: "55%", left: "88%", w: 12, h: 18, opacity: 0.06 },
        { top: "78%", left: "18%", w: 8, h: 13, opacity: 0.07 },
      ].map((cross, i) => (
        <div
          key={`cross-${i}`}
          className="absolute"
          style={{ top: cross.top, left: cross.left }}
        >
          <div
            className="relative"
            style={{ width: cross.w, height: cross.h, opacity: cross.opacity }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-primary rounded-full" />
            <div className="absolute top-[22%] left-0 w-full h-[2px] bg-primary rounded-full" />
          </div>
        </div>
      ))}

      {/* CSS sparkles */}
      {sparkles.map((s) => (
        <div
          key={`sparkle-${s.id}`}
          className="absolute rounded-full bg-primary animate-pulse"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.3) 100%)`,
        }}
      />
    </div>
  );
});

ParallaxBackground.displayName = "ParallaxBackground";

export default ParallaxBackground;
