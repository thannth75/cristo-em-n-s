import { useRef, useEffect, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface ParallaxBackgroundProps {
  variant?: "default" | "worship" | "serene";
}

const ParallaxBackground = ({ variant = "default" }: ParallaxBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { scrollY } = useScroll();

  // Smooth parallax layers with different depths
  const y1 = useTransform(scrollY, [0, 800], [0, -100]);
  const y2 = useTransform(scrollY, [0, 800], [0, -50]);
  const y3 = useTransform(scrollY, [0, 800], [0, -150]);
  const y4 = useTransform(scrollY, [0, 800], [0, -30]);
  const rotate1 = useTransform(scrollY, [0, 800], [0, 8]);
  const rotate2 = useTransform(scrollY, [0, 800], [0, -5]);
  const scale1 = useTransform(scrollY, [0, 400], [1, 1.1]);
  const opacity1 = useTransform(scrollY, [0, 600], [1, 0.4]);

  // Spring-based mouse tracking for ultra-smooth feel
  const springX = useSpring(0, { stiffness: 30, damping: 20 });
  const springY = useSpring(0, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const handleMove = (e: TouchEvent | MouseEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      const nx = (x / window.innerWidth - 0.5) * 2;
      const ny = (y / window.innerHeight - 0.5) * 2;
      setMousePos({ x: nx, y: ny });
      springX.set(nx);
      springY.set(ny);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove as EventListener);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove as EventListener);
    };
  }, [springX, springY]);

  // Generate subtle star/sparkle positions
  const sparkles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      top: `${8 + Math.random() * 84}%`,
      left: `${5 + Math.random() * 90}%`,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 6,
      duration: 3 + Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.2,
    })), []
  );

  // Dove/peace symbols positions
  const peaceSymbols = useMemo(() => [
    { top: "12%", left: "8%", scale: 1, depth: y1 },
    { top: "55%", right: "6%", scale: 0.8, depth: y3 },
    { top: "78%", left: "15%", scale: 0.6, depth: y2 },
  ], [y1, y2, y3]);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* === LAYER 1: Deep ambient glow === */}
      <motion.div
        style={{ y: y4, scale: scale1, opacity: opacity1 }}
        className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[160%] h-[70%] rounded-full blur-[120px]"
        animate={{
          x: mousePos.x * -12,
        }}
        transition={{ type: "spring", stiffness: 20, damping: 25 }}
      >
        <div className="w-full h-full bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full" 
          style={{ background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, hsl(var(--primary) / 0.03) 40%, transparent 70%)` }}
        />
      </motion.div>

      {/* === LAYER 2: Bottom warm glow (hope/warmth) === */}
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-[-10%] right-[-5%] w-[80%] h-[50%] rounded-full blur-[100px]"
        animate={{ x: mousePos.x * 8 }}
        transition={{ type: "spring", stiffness: 25, damping: 20 }}
      >
        <div className="w-full h-full rounded-full"
          style={{ background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, transparent 65%)` }}
        />
      </motion.div>

      {/* === LAYER 3: Floating crosses (faith symbols) === */}
      {/* Cross 1 - larger, top area */}
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="absolute top-[14%] left-[9%]"
        animate={{
          x: mousePos.x * 18,
          y: mousePos.y * 12,
        }}
        transition={{ type: "spring", stiffness: 25, damping: 18 }}
      >
        <div className="relative w-7 h-11 opacity-[0.10]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-full bg-primary rounded-full" />
          <div className="absolute top-[22%] left-0 w-full h-[3px] bg-primary rounded-full" />
        </div>
      </motion.div>

      {/* Cross 2 - medium, right side */}
      <motion.div
        style={{ y: y3, rotate: rotate2 }}
        className="absolute top-[58%] right-[10%]"
        animate={{
          x: mousePos.x * -22,
          y: mousePos.y * -16,
        }}
        transition={{ type: "spring", stiffness: 22, damping: 16 }}
      >
        <div className="relative w-9 h-14 opacity-[0.07]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-full bg-primary rounded-full" />
          <div className="absolute top-[22%] left-0 w-full h-[3px] bg-primary rounded-full" />
        </div>
      </motion.div>

      {/* Cross 3 - small, subtle */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[35%] right-[30%]"
        animate={{
          x: mousePos.x * 10,
          y: mousePos.y * 8,
        }}
        transition={{ type: "spring", stiffness: 30, damping: 22 }}
      >
        <div className="relative w-4 h-6 opacity-[0.06]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-primary rounded-full" />
          <div className="absolute top-[22%] left-0 w-full h-[2px] bg-primary rounded-full" />
        </div>
      </motion.div>

      {/* === LAYER 4: Light orbs (Holy Spirit / divine presence) === */}
      {[
        { top: "18%", left: "72%", size: 130, depth: y1, mx: -16, opacity: 0.06 },
        { top: "42%", left: "6%", size: 90, depth: y2, mx: 14, opacity: 0.05 },
        { top: "72%", left: "60%", size: 110, depth: y3, mx: -12, opacity: 0.06 },
        { top: "8%", left: "38%", size: 70, depth: y2, mx: 10, opacity: 0.04 },
        { top: "88%", left: "22%", size: 80, depth: y1, mx: -8, opacity: 0.05 },
        { top: "50%", left: "85%", size: 60, depth: y4, mx: -6, opacity: 0.04 },
      ].map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          style={{ y: orb.depth, top: orb.top, left: orb.left }}
          className="absolute rounded-full"
          animate={{
            x: mousePos.x * orb.mx,
            y: mousePos.y * (orb.mx * 0.5),
          }}
          transition={{ type: "spring", stiffness: 20, damping: 18 }}
        >
          <div
            className="rounded-full bg-primary blur-3xl"
            style={{
              width: orb.size,
              height: orb.size,
              opacity: orb.opacity,
            }}
          />
        </motion.div>
      ))}

      {/* === LAYER 5: Gentle light rays (divine light descending) === */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-0 right-[-3%] w-[25%] h-[130%] opacity-[0.025] rotate-[18deg] origin-top-right"
        animate={{ x: mousePos.x * -6 }}
        transition={{ type: "spring", stiffness: 30, damping: 25 }}
      >
        <div className="w-full h-full" style={{
          background: `linear-gradient(to bottom, hsl(var(--primary) / 0.8) 0%, hsl(var(--primary) / 0.3) 40%, transparent 80%)`
        }} />
      </motion.div>

      <motion.div
        style={{ y: y3 }}
        className="absolute top-[5%] left-[-2%] w-[18%] h-[110%] opacity-[0.02] rotate-[-12deg] origin-top-left"
        animate={{ x: mousePos.x * 5 }}
        transition={{ type: "spring", stiffness: 30, damping: 25 }}
      >
        <div className="w-full h-full" style={{
          background: `linear-gradient(to bottom, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.2) 50%, transparent 85%)`
        }} />
      </motion.div>

      {/* Central divine ray */}
      <motion.div
        style={{ y: y4 }}
        className="absolute top-[-5%] left-[45%] w-[12%] h-[120%] opacity-[0.015] rotate-[3deg]"
        animate={{ x: mousePos.x * -3 }}
        transition={{ type: "spring", stiffness: 25, damping: 20 }}
      >
        <div className="w-full h-full" style={{
          background: `linear-gradient(to bottom, hsl(var(--primary) / 0.5) 0%, hsl(var(--primary) / 0.1) 60%, transparent 90%)`
        }} />
      </motion.div>

      {/* === LAYER 6: Sparkles / stars (heaven's light) === */}
      {sparkles.map((s) => (
        <motion.div
          key={`sparkle-${s.id}`}
          className="absolute rounded-full bg-primary"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
          }}
          animate={{
            opacity: [0, s.opacity, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* === LAYER 7: Soft dot grid for depth === */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 opacity-[0.012]"
        animate={{
          x: mousePos.x * 4,
          y: mousePos.y * 4,
        }}
        transition={{ type: "spring", stiffness: 40, damping: 25 }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 0.8px, transparent 0.8px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </motion.div>

      {/* === LAYER 8: Flowing gradient wave (peace/water of life) === */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-[30%] opacity-[0.03]"
        style={{ y: y4 }}
      >
        <motion.div
          className="w-[200%] h-full"
          animate={{ x: [0, "-50%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            background: `repeating-linear-gradient(
              90deg,
              transparent 0%,
              hsl(var(--primary) / 0.3) 25%,
              transparent 50%
            )`,
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* === LAYER 9: Dove silhouettes (peace/Holy Spirit) === */}
      {peaceSymbols.map((pos, i) => (
        <motion.div
          key={`dove-${i}`}
          style={{ 
            y: pos.depth, 
            top: pos.top, 
            left: pos.left,
            right: (pos as any).right,
          }}
          className="absolute"
          animate={{
            x: mousePos.x * (12 * (i % 2 === 0 ? 1 : -1)),
            y: mousePos.y * 8,
          }}
          transition={{ type: "spring", stiffness: 18, damping: 15 }}
        >
          <svg 
            width={24 * pos.scale} 
            height={24 * pos.scale} 
            viewBox="0 0 24 24" 
            fill="none" 
            className="opacity-[0.06]"
          >
            <path 
              d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z" 
              fill="currentColor" 
              className="text-primary"
            />
          </svg>
        </motion.div>
      ))}

      {/* === Vignette edges for depth === */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.4) 100%)`,
        }}
      />
    </div>
  );
};

export default ParallaxBackground;
