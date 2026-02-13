import { useRef, useEffect, useState, useMemo, forwardRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxBackgroundProps {
  variant?: "default" | "worship" | "serene";
}

const ParallaxBackground = forwardRef<HTMLDivElement, ParallaxBackgroundProps>(
  ({ variant = "default" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { scrollY } = useScroll();

    const y1 = useTransform(scrollY, [0, 800], [0, -80]);
    const y2 = useTransform(scrollY, [0, 800], [0, -40]);
    const y3 = useTransform(scrollY, [0, 800], [0, -120]);
    const rotate1 = useTransform(scrollY, [0, 800], [0, 8]);
    const scale1 = useTransform(scrollY, [0, 400], [1, 1.1]);
    const opacity1 = useTransform(scrollY, [0, 600], [1, 0.6]);

    useEffect(() => {
      const handleMove = (e: TouchEvent | MouseEvent) => {
        const x = "touches" in e ? e.touches[0].clientX : e.clientX;
        const y = "touches" in e ? e.touches[0].clientY : e.clientY;
        setMousePos({
          x: (x / window.innerWidth - 0.5) * 2,
          y: (y / window.innerHeight - 0.5) * 2,
        });
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove as EventListener);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("touchmove", handleMove as EventListener);
      };
    }, []);

    // Sparkles - celestial dots
    const sparkles = useMemo(
      () =>
        Array.from({ length: 25 }, (_, i) => ({
          id: i,
          top: `${5 + Math.random() * 90}%`,
          left: `${3 + Math.random() * 94}%`,
          size: 2 + Math.random() * 5,
          delay: Math.random() * 6,
          duration: 3 + Math.random() * 4,
          opacity: 0.3 + Math.random() * 0.5,
        })),
      []
    );

    // Floating crosses
    const crosses = useMemo(
      () => [
        { top: "8%", left: "8%", w: 14, h: 22, opacity: 0.2 },
        { top: "50%", left: "85%", w: 16, h: 24, opacity: 0.15 },
        { top: "25%", left: "72%", w: 10, h: 16, opacity: 0.12 },
        { top: "72%", left: "15%", w: 12, h: 18, opacity: 0.14 },
        { top: "38%", left: "45%", w: 8, h: 12, opacity: 0.08 },
      ],
      []
    );

    return (
      <div
        ref={ref || containerRef}
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      >
        {/* === Main ambient glow - TOP === */}
        <motion.div
          style={{ y: y2, scale: scale1, opacity: opacity1 }}
          className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[160%] h-[70%] rounded-full blur-[80px]"
          animate={{ x: mousePos.x * -12 }}
          transition={{ type: "spring", stiffness: 20, damping: 25 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.25) 0%, hsl(var(--primary) / 0.12) 30%, transparent 60%)`,
            }}
          />
        </motion.div>

        {/* === Bottom glow === */}
        <motion.div
          style={{ y: y1 }}
          className="absolute bottom-[-10%] right-[-8%] w-[80%] h-[50%] rounded-full blur-[70px]"
          animate={{ x: mousePos.x * 8 }}
          transition={{ type: "spring", stiffness: 25, damping: 20 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.18) 0%, transparent 55%)`,
            }}
          />
        </motion.div>

        {/* === Left accent glow === */}
        <motion.div
          style={{ y: y3 }}
          className="absolute top-[35%] left-[-12%] w-[50%] h-[45%] rounded-full blur-[60px]"
          animate={{ x: mousePos.x * -6 }}
          transition={{ type: "spring", stiffness: 22, damping: 20 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.12) 0%, transparent 50%)`,
            }}
          />
        </motion.div>

        {/* === Floating crosses with parallax === */}
        {crosses.map((cross, i) => (
          <motion.div
            key={`cross-${i}`}
            className="absolute"
            style={{ top: cross.top, left: cross.left }}
            animate={{
              x: mousePos.x * (12 + i * 4) * (i % 2 === 0 ? 1 : -1),
              y: [0, -8, 0, 8, 0],
              rotate: [0, 3, 0, -3, 0],
            }}
            transition={{
              x: { type: "spring", stiffness: 20, damping: 15 },
              y: { duration: 6 + i * 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <div
              className="relative"
              style={{ width: cross.w, height: cross.h, opacity: cross.opacity }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-full bg-primary rounded-full" />
              <div className="absolute top-[22%] left-0 w-full h-[3px] bg-primary rounded-full" />
            </div>
          </motion.div>
        ))}

        {/* === Light orbs === */}
        {[
          { top: "12%", left: "68%", size: 180, mx: -15, opacity: 0.14 },
          { top: "35%", left: "8%", size: 140, mx: 12, opacity: 0.12 },
          { top: "65%", left: "55%", size: 160, mx: -10, opacity: 0.1 },
          { top: "80%", left: "25%", size: 120, mx: -8, opacity: 0.11 },
        ].map((orb, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full"
            style={{ top: orb.top, left: orb.left }}
            animate={{
              x: mousePos.x * orb.mx,
              scale: [1, 1.1, 1, 0.95, 1],
            }}
            transition={{
              x: { type: "spring", stiffness: 18, damping: 16 },
              scale: { duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" },
            }}
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

        {/* === Divine light rays === */}
        <motion.div
          style={{ y: y2 }}
          className="absolute top-0 right-[-2%] w-[25%] h-[130%] opacity-[0.07] rotate-[16deg] origin-top-right"
          animate={{ x: mousePos.x * -6 }}
          transition={{ type: "spring", stiffness: 25, damping: 22 }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(to bottom, hsl(var(--primary) / 0.9) 0%, hsl(var(--primary) / 0.3) 40%, transparent 75%)`,
            }}
          />
        </motion.div>

        <motion.div
          style={{ y: y3 }}
          className="absolute top-[5%] left-[-2%] w-[18%] h-[110%] opacity-[0.05] rotate-[-12deg] origin-top-left"
          animate={{ x: mousePos.x * 5 }}
          transition={{ type: "spring", stiffness: 25, damping: 22 }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(to bottom, hsl(var(--primary) / 0.7) 0%, hsl(var(--primary) / 0.2) 50%, transparent 80%)`,
            }}
          />
        </motion.div>

        {/* === Celestial sparkles === */}
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
              scale: [0.5, 1.3, 0.5],
            }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* === Flowing wave at bottom === */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-[30%] opacity-[0.06]"
        >
          <motion.div
            className="w-[200%] h-full"
            animate={{ x: [0, "-50%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{
              background: `repeating-linear-gradient(
                90deg,
                transparent 0%,
                hsl(var(--primary) / 0.5) 25%,
                transparent 50%
              )`,
              maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            }}
          />
        </motion.div>

        {/* === Soft dot grid === */}
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          animate={{
            x: mousePos.x * 4,
            y: mousePos.y * 4,
          }}
          transition={{ type: "spring", stiffness: 35, damping: 25 }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: "35px 35px",
            }}
          />
        </motion.div>

        {/* === Soft vignette === */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.4) 100%)`,
          }}
        />
      </div>
    );
  }
);

ParallaxBackground.displayName = "ParallaxBackground";

export default ParallaxBackground;
