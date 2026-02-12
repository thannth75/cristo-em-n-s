import { useRef, useEffect, useState, useMemo, forwardRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface ParallaxBackgroundProps {
  variant?: "default" | "worship" | "serene";
}

const ParallaxBackground = forwardRef<HTMLDivElement, ParallaxBackgroundProps>(
  ({ variant = "default" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { scrollY } = useScroll();

    // Smooth parallax layers with different depths
    const y1 = useTransform(scrollY, [0, 800], [0, -120]);
    const y2 = useTransform(scrollY, [0, 800], [0, -60]);
    const y3 = useTransform(scrollY, [0, 800], [0, -180]);
    const y4 = useTransform(scrollY, [0, 800], [0, -40]);
    const rotate1 = useTransform(scrollY, [0, 800], [0, 10]);
    const rotate2 = useTransform(scrollY, [0, 800], [0, -7]);
    const scale1 = useTransform(scrollY, [0, 400], [1, 1.15]);
    const opacity1 = useTransform(scrollY, [0, 600], [1, 0.5]);

    // Spring-based mouse tracking
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

    // Sparkle positions
    const sparkles = useMemo(
      () =>
        Array.from({ length: 18 }, (_, i) => ({
          id: i,
          top: `${5 + Math.random() * 90}%`,
          left: `${3 + Math.random() * 94}%`,
          size: 2 + Math.random() * 4,
          delay: Math.random() * 5,
          duration: 2.5 + Math.random() * 3.5,
          opacity: 0.25 + Math.random() * 0.35,
        })),
      []
    );

    // Cross positions
    const crosses = useMemo(
      () => [
        { top: "10%", left: "7%", w: 10, h: 16, opacity: 0.15, depth: y1, mx: 20 },
        { top: "55%", left: "88%", w: 12, h: 18, opacity: 0.12, depth: y3, mx: -25 },
        { top: "30%", left: "75%", w: 6, h: 10, opacity: 0.10, depth: y2, mx: 12 },
        { top: "75%", left: "12%", w: 8, h: 13, opacity: 0.10, depth: y2, mx: -15 },
      ],
      [y1, y2, y3]
    );

    return (
      <div
        ref={ref || containerRef}
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      >
        {/* === LAYER 1: Deep ambient glow === */}
        <motion.div
          style={{ y: y4, scale: scale1, opacity: opacity1 }}
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[180%] h-[80%] rounded-full blur-[100px]"
          animate={{ x: mousePos.x * -15 }}
          transition={{ type: "spring", stiffness: 20, damping: 25 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.08) 35%, transparent 65%)`,
            }}
          />
        </motion.div>

        {/* === LAYER 2: Bottom warm glow === */}
        <motion.div
          style={{ y: y2 }}
          className="absolute bottom-[-15%] right-[-10%] w-[90%] h-[55%] rounded-full blur-[90px]"
          animate={{ x: mousePos.x * 10 }}
          transition={{ type: "spring", stiffness: 25, damping: 20 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.12) 0%, transparent 60%)`,
            }}
          />
        </motion.div>

        {/* === Secondary glow left === */}
        <motion.div
          style={{ y: y3 }}
          className="absolute top-[30%] left-[-15%] w-[60%] h-[50%] rounded-full blur-[80px]"
          animate={{ x: mousePos.x * -8 }}
          transition={{ type: "spring", stiffness: 22, damping: 20 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 55%)`,
            }}
          />
        </motion.div>

        {/* === LAYER 3: Floating crosses === */}
        {crosses.map((cross, i) => (
          <motion.div
            key={`cross-${i}`}
            style={{ y: cross.depth, rotate: i % 2 === 0 ? rotate1 : rotate2 }}
            className="absolute"
            initial={{ top: cross.top, left: cross.left }}
            animate={{
              x: mousePos.x * cross.mx,
              y: mousePos.y * (cross.mx * 0.5),
            }}
            transition={{ type: "spring", stiffness: 22, damping: 16 }}
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

        {/* === LAYER 4: Light orbs === */}
        {[
          { top: "15%", left: "70%", size: 160, depth: y1, mx: -18, opacity: 0.10 },
          { top: "40%", left: "5%", size: 120, depth: y2, mx: 16, opacity: 0.08 },
          { top: "70%", left: "55%", size: 140, depth: y3, mx: -14, opacity: 0.09 },
          { top: "5%", left: "35%", size: 100, depth: y2, mx: 12, opacity: 0.07 },
          { top: "85%", left: "20%", size: 110, depth: y1, mx: -10, opacity: 0.08 },
          { top: "48%", left: "82%", size: 90, depth: y4, mx: -8, opacity: 0.07 },
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

        {/* === LAYER 5: Divine light rays === */}
        <motion.div
          style={{ y: y2 }}
          className="absolute top-0 right-[-3%] w-[28%] h-[140%] opacity-[0.05] rotate-[18deg] origin-top-right"
          animate={{ x: mousePos.x * -8 }}
          transition={{ type: "spring", stiffness: 30, damping: 25 }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(to bottom, hsl(var(--primary) / 0.9) 0%, hsl(var(--primary) / 0.4) 35%, transparent 75%)`,
            }}
          />
        </motion.div>

        <motion.div
          style={{ y: y3 }}
          className="absolute top-[3%] left-[-3%] w-[20%] h-[120%] opacity-[0.04] rotate-[-14deg] origin-top-left"
          animate={{ x: mousePos.x * 6 }}
          transition={{ type: "spring", stiffness: 30, damping: 25 }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(to bottom, hsl(var(--primary) / 0.7) 0%, hsl(var(--primary) / 0.25) 45%, transparent 80%)`,
            }}
          />
        </motion.div>

        {/* Central light beam */}
        <motion.div
          style={{ y: y4 }}
          className="absolute top-[-8%] left-[42%] w-[16%] h-[130%] opacity-[0.03] rotate-[2deg]"
          animate={{ x: mousePos.x * -4 }}
          transition={{ type: "spring", stiffness: 25, damping: 20 }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(to bottom, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.15) 55%, transparent 85%)`,
            }}
          />
        </motion.div>

        {/* === LAYER 6: Sparkles === */}
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
              scale: [0.3, 1.2, 0.3],
            }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* === LAYER 7: Dot grid === */}
        <motion.div
          style={{ y: y1 }}
          className="absolute inset-0 opacity-[0.025]"
          animate={{
            x: mousePos.x * 5,
            y: mousePos.y * 5,
          }}
          transition={{ type: "spring", stiffness: 40, damping: 25 }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </motion.div>

        {/* === LAYER 8: Flowing wave === */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-[35%] opacity-[0.05]"
          style={{ y: y4 }}
        >
          <motion.div
            className="w-[200%] h-full"
            animate={{ x: [0, "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
              background: `repeating-linear-gradient(
                90deg,
                transparent 0%,
                hsl(var(--primary) / 0.4) 25%,
                transparent 50%
              )`,
              maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 0%, transparent 100%)",
            }}
          />
        </motion.div>

        {/* === LAYER 9: Dove/checkmark symbols === */}
        {[
          { top: "12%", left: "85%", scale: 1.2, depth: y1 },
          { top: "60%", left: "5%", scale: 0.9, depth: y3 },
          { top: "82%", left: "70%", scale: 0.7, depth: y2 },
        ].map((pos, i) => (
          <motion.div
            key={`dove-${i}`}
            style={{
              y: pos.depth,
              top: pos.top,
              left: pos.left,
            }}
            className="absolute"
            animate={{
              x: mousePos.x * (14 * (i % 2 === 0 ? 1 : -1)),
              y: mousePos.y * 10,
            }}
            transition={{ type: "spring", stiffness: 18, damping: 15 }}
          >
            <svg
              width={28 * pos.scale}
              height={28 * pos.scale}
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-[0.10]"
            >
              <path
                d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"
                fill="currentColor"
                className="text-primary"
              />
            </svg>
          </motion.div>
        ))}

        {/* === Vignette === */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 45%, hsl(var(--background) / 0.5) 100%)`,
          }}
        />
      </div>
    );
  }
);

ParallaxBackground.displayName = "ParallaxBackground";

export default ParallaxBackground;
