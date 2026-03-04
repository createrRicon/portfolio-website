"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import CassetteTape from "./CassetteTape";

export default function Scene() {
  return (
    <div className="w-full h-screen">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />

        {/* 环境光 */}
        <ambientLight intensity={0.5} />

        {/* 主光源 */}
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        {/* 环境反射 */}
        <Environment preset="studio" />

        {/* 3D 磁带模型 */}
        <CassetteTape />
      </Canvas>
    </div>
  );
}
