import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Stars } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

export type OrbState = "idle" | "thinking" | "speaking";

function Orb({ state }: { state: OrbState }) {
  const mesh = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const speed = state === "speaking" ? 2 : state === "thinking" ? 1.2 : 0.4;
    mesh.current.rotation.x += delta * speed * 0.3;
    mesh.current.rotation.y += delta * speed * 0.5;
  });

  const distort = state === "speaking" ? 0.55 : state === "thinking" ? 0.35 : 0.2;
  const speed   = state === "speaking" ? 4    : state === "thinking" ? 2    : 1;
  const color   = state === "speaking" ? "#7c5cff" : state === "thinking" ? "#22d3ee" : "#38bdf8";

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
      <Sphere ref={mesh} args={[1.2, 96, 96]}>
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={speed}
          roughness={0.15}
          metalness={0.6}
          emissive={color}
          emissiveIntensity={0.35}
        />
      </Sphere>
    </Float>
  );
}

export default function ChatbotOrb({ state = "idle" }: { state?: OrbState }) {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]}   intensity={1.2} color="#a78bfa" />
      <pointLight position={[-5, -3, -2]} intensity={0.8} color="#22d3ee" />
      <Stars radius={50} depth={50} count={1500} factor={4} fade speed={1} />
      <Orb state={state} />
    </Canvas>
  );
}
