import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef } from "react";

function Orb() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.25;
      ref.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere ref={ref} args={[1.35, 64, 64]} scale={1.8}>
        <MeshDistortMaterial color="#76e4f7" roughness={0.1} distort={0.45} speed={2.2} />
      </Sphere>
    </Float>
  );
}

export function OrbScene() {
  return (
    <div className="h-[320px] w-full">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 4, 3]} intensity={2} />
        <Orb />
      </Canvas>
    </div>
  );
}
