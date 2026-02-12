import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const ParallaxBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -80]);
  const y2 = useTransform(scrollY, [0, 500], [0, -40]);
  const y3 = useTransform(scrollY, [0, 500], [0, -120]);
  const rotate1 = useTransform(scrollY, [0, 500], [0, 15]);
  const rotate2 = useTransform(scrollY, [0, 500], [0, -10]);
  const scale1 = useTransform(scrollY, [0, 300], [1, 1.15]);

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
    window.addEventListener("touchmove", handleMove as any);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove as any);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Radial glow */}
      <motion.div
        style={{ y: y2, scale: scale1 }}
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[140%] h-[60%] rounded-full bg-primary/8 blur-[100px]"
        animate={{
          x: mousePos.x * -15,
          y: mousePos.y * -10,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      />

      {/* Floating cross 1 */}
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="absolute top-[15%] left-[10%]"
        animate={{
          x: mousePos.x * 20,
          y: mousePos.y * 15,
        }}
        transition={{ type: "spring", stiffness: 40, damping: 25 }}
      >
        <div className="relative w-6 h-10 opacity-[0.12]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-full bg-primary rounded-full" />
          <div className="absolute top-[25%] left-0 w-full h-1.5 bg-primary rounded-full" />
        </div>
      </motion.div>

      {/* Floating cross 2 */}
      <motion.div
        style={{ y: y3, rotate: rotate2 }}
        className="absolute top-[60%] right-[12%]"
        animate={{
          x: mousePos.x * -25,
          y: mousePos.y * -20,
        }}
        transition={{ type: "spring", stiffness: 35, damping: 20 }}
      >
        <div className="relative w-8 h-12 opacity-[0.08]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-full bg-primary rounded-full" />
          <div className="absolute top-[25%] left-0 w-full h-2 bg-primary rounded-full" />
        </div>
      </motion.div>

      {/* Light orbs - parallax layers */}
      {[
        { top: "20%", left: "75%", size: "120px", depth: y1, mx: -18, opacity: 0.06 },
        { top: "45%", left: "8%", size: "80px", depth: y2, mx: 12, opacity: 0.05 },
        { top: "75%", left: "65%", size: "100px", depth: y3, mx: -10, opacity: 0.07 },
        { top: "10%", left: "40%", size: "60px", depth: y2, mx: 15, opacity: 0.04 },
        { top: "85%", left: "25%", size: "70px", depth: y1, mx: -8, opacity: 0.05 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          style={{ y: orb.depth, top: orb.top, left: orb.left }}
          className="absolute rounded-full"
          animate={{
            x: mousePos.x * orb.mx,
            y: mousePos.y * (orb.mx * 0.6),
          }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
        >
          <div
            className="rounded-full bg-primary blur-2xl"
            style={{
              width: orb.size,
              height: orb.size,
              opacity: orb.opacity,
            }}
          />
        </motion.div>
      ))}

      {/* Diagonal light rays */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-0 right-[-5%] w-[30%] h-[120%] opacity-[0.03] rotate-[20deg] origin-top-right"
        animate={{ x: mousePos.x * -8 }}
        transition={{ type: "spring", stiffness: 40, damping: 30 }}
      >
        <div className="w-full h-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />
      </motion.div>

      <motion.div
        style={{ y: y3 }}
        className="absolute top-[10%] left-[-3%] w-[20%] h-[100%] opacity-[0.02] rotate-[-15deg] origin-top-left"
        animate={{ x: mousePos.x * 6 }}
        transition={{ type: "spring", stiffness: 40, damping: 30 }}
      >
        <div className="w-full h-full bg-gradient-to-b from-primary via-primary/30 to-transparent" />
      </motion.div>

      {/* Subtle dot grid for depth */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 opacity-[0.015]"
        animate={{
          x: mousePos.x * 5,
          y: mousePos.y * 5,
        }}
        transition={{ type: "spring", stiffness: 60, damping: 30 }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </motion.div>
    </div>
  );
};

export default ParallaxBackground;
