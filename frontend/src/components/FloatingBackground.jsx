import { useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';

function FloatCube({ position = [0, 0, 0], scale = 1, color = '#8b5cf6' }) {
  useFrame((state, delta) => {
    state.scene.children.forEach((child) => {
      if (child.userData.spin) {
        child.rotation.x += delta * 0.2;
        child.rotation.y += delta * 0.3;
        child.position.y += Math.sin(state.clock.elapsedTime * 0.6 + child.position.x) * 0.0008;
      }
    });
  });

  return (
    <mesh position={position} scale={scale} userData={{ spin: true }}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} transparent opacity={0.28} />
    </mesh>
  );
}

export default function FloatingBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  const blobX = useTransform(springX, [-1, 1], [-20, 20]);
  const blobY = useTransform(springY, [-1, 1], [-20, 20]);

  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  const particleOptions = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        size: 2 + (i % 4),
        left: `${(i * 13) % 100}%`,
        top: `${(i * 17) % 100}%`,
        duration: 7 + (i % 6),
        delay: (i % 5) * 0.5,
        color: ['#8b5cf6', '#22d3ee', '#ec4899'][i % 3],
      })),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-grid opacity-35" />

      <motion.div
        style={{ x: blobX, y: blobY }}
        className="absolute -left-20 top-8 h-96 w-96 rounded-full bg-gradient-to-br from-[#8b5cf6]/45 via-[#22d3ee]/20 to-transparent soft-light"
      />
      <motion.div
        style={{ x: useTransform(blobX, (v) => v * -0.7), y: useTransform(blobY, (v) => v * -0.7) }}
        className="absolute right-0 top-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-[#ec4899]/35 via-[#8b5cf6]/25 to-transparent soft-light"
      />
      <div className="absolute left-1/3 bottom-0 h-[25rem] w-[25rem] rounded-full bg-gradient-to-br from-[#22d3ee]/25 via-[#8b5cf6]/15 to-transparent soft-light animate-float" />

      <div className="absolute inset-0 opacity-60">
        {particleOptions.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              top: p.top,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}`,
            }}
            animate={{ y: [0, -24, 0], opacity: [0.15, 0.55, 0.15] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      <div className="absolute inset-0 opacity-55">
        <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <pointLight intensity={1.3} color="#22d3ee" position={[2, 3, 4]} />
          <pointLight intensity={1} color="#8b5cf6" position={[-2, -2, 3]} />
          <FloatCube position={[-2.8, 1.4, -1]} scale={0.55} color="#22d3ee" />
          <FloatCube position={[2.5, -1.6, -0.2]} scale={0.9} color="#8b5cf6" />
          <FloatCube position={[0.6, 1.8, -1.8]} scale={0.42} color="#ec4899" />
        </Canvas>
      </div>
    </div>
  );
}
