import { useTheme } from "next-themes";
import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function ParticleSphere({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);

  // Generate 2000 random points within a sphere radius
  const sphere = useMemo(() => {
    const particles = 2000;
    const positions = new Float32Array(particles * 3);
    for (let i = 0; i < particles; i++) {
       const u = Math.random();
       const v = Math.random();
       const theta = u * 2.0 * Math.PI;
       const phi = Math.acos(2.0 * v - 1.0);
       const r = Math.cbrt(Math.random()) * 2.2; // Sphere spread radius

       const sinPhi = Math.sin(phi);
       positions[i * 3] = r * sinPhi * Math.cos(theta);
       positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
       positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  // Extremely slow, minimal rotation for SaaS vibe
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 30;
      ref.current.rotation.y -= delta / 40;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={color}
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.15} // Kept low for elegance
        />
      </Points>
    </group>
  );
}

export function GlobalBackground() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="fixed inset-0 z-[-1] bg-background" />;

  const isDark = resolvedTheme === "dark";
  const particleColor = isDark ? "#ffffff" : "#000000";

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] bg-background">
      <Canvas camera={{ position: [0, 0, 3] }} gl={{ antialias: false, alpha: true }}>
        <ParticleSphere color={particleColor} />
      </Canvas>
    </div>
  );
}
