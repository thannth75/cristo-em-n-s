import { useRef, useEffect, useState, useMemo, forwardRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const ParallaxBackground = forwardRef<HTMLDivElement>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 800], [0, -50]);
  const y2 = useTransform(scrollY, [0, 800], [0, -30]);

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

  // Sparkles suaves
  const sparkles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
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

  // Cruzes delicadas
  const crosses = useMemo(
    () => [
      { top: "10%", left: "10%", w: 10, h: 16, opacity: 0.08 },
      { top: "55%", left: "88%", w: 12, h: 18, opacity: 0.06 },
      { top: "78%", left: "18%", w: 8, h: 13, opacity: 0.07 },
    ],
    []
  );

  return (
    <div
      ref={ref || containerRef}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Glow suave no topo */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[60%] rounded-full blur-[100px]"
        animate={{ x: mousePos.x * -8 }}
        transition={{ type: "spring", stiffness: 15, damping: 30 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.06) 35%, transparent 65%)`,
          }}
        />
      </motion.div>

      {/* Glow inferior */}
      <motion.div
        style={{ y: y1 }}
        className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[45%] rounded-full blur-[80px]"
        animate={{ x: mousePos.x * 6 }}
        transition={{ type: "spring", stiffness: 18, damping: 25 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.1) 0%, transparent 55%)`,
          }}
        />
      </motion.div>

      {/* Cruzes flutuantes */}
      {crosses.map((cross, i) => (
        <motion.div
          key={`cross-${i}`}
          className="absolute"
          style={{ top: cross.top, left: cross.left }}
          animate={{
            x: mousePos.x * (6 + i * 3) * (i % 2 === 0 ? 1 : -1),
            y: [0, -6, 0, 6, 0],
          }}
          transition={{
            x: { type: "spring", stiffness: 15, damping: 20 },
            y: { duration: 10 + i * 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div
            className="relative"
            style={{ width: cross.w, height: cross.h, opacity: cross.opacity }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-primary rounded-full" />
            <div className="absolute top-[22%] left-0 w-full h-[2px] bg-primary rounded-full" />
          </div>
        </motion.div>
      ))}

      {/* Orbes de luz suaves */}
      {[
        { top: "15%", left: "70%", size: 120, mx: -8, opacity: 0.07 },
        { top: "60%", left: "12%", size: 100, mx: 6, opacity: 0.06 },
      ].map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{ top: orb.top, left: orb.left }}
          animate={{
            x: mousePos.x * orb.mx,
            scale: [1, 1.08, 1, 0.96, 1],
          }}
          transition={{
            x: { type: "spring", stiffness: 12, damping: 20 },
            scale: { duration: 12 + i * 4, repeat: Infinity, ease: "easeInOut" },
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

      {/* Sparkles celestiais */}
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
            scale: [0.6, 1.2, 0.6],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Vinheta suave */}
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
