import { forwardRef, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const AnimatedOrb = forwardRef<THREE.Mesh>(function AnimatedOrb(_, ref) {
  const meshRef = useRef<THREE.Mesh>(null);
  const actualRef = (ref as React.RefObject<THREE.Mesh>) || meshRef;

  useFrame((state) => {
    const mesh = actualRef.current || meshRef.current;
    if (mesh) {
      mesh.rotation.x = state.clock.elapsedTime * 0.2;
      mesh.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.5}>
      <MeshDistortMaterial
        color="#22c55e"
        attach="material"
        distort={0.4}
        speed={2}
        roughness={0.2}
        metalness={0.8}
        transparent
        opacity={0.7}
      />
    </Sphere>
  );
});

interface GlowOrbProps {
  className?: string;
}

export default function GlowOrb({ className = "" }: GlowOrbProps) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4ade80" />
        <AnimatedOrb />
      </Canvas>
    </div>
  );
}
