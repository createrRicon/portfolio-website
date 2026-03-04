"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

export default function CassetteTape() {
  const cassetteRef = useRef<Mesh>(null);
  const leftReelRef = useRef<Mesh>(null);
  const rightReelRef = useRef<Mesh>(null);

  const [hovered, setHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 磁带轮旋转动画
  useFrame((state) => {
    if (leftReelRef.current && rightReelRef.current) {
      leftReelRef.current.rotation.z += 0.02;
      rightReelRef.current.rotation.z += 0.02;
    }

    // 悬浮时的微动效
    if (cassetteRef.current && hovered) {
      cassetteRef.current.rotation.y += 0.005;
      cassetteRef.current.rotation.x = mousePosition.y * 0.3;
      cassetteRef.current.rotation.y = mousePosition.x * 0.3 + state.clock.elapsedTime * 0.1;
    } else if (cassetteRef.current) {
      cassetteRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const handlePointerMove = (event: any) => {
    const { x, y } = event.point;
    setMousePosition({ x: x / 2, y: y / 2 });
  };

  return (
    <group
      ref={cassetteRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerMove={handlePointerMove}
    >
      {/* 磁带主体 */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3, 2, 0.4]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* 磁带标签区域 */}
      <mesh position={[0, 0.3, 0.21]}>
        <boxGeometry args={[2.6, 0.8, 0.02]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.8} />
      </mesh>

      {/* 标签文字 - 使用简单的几何体模拟 */}
      <mesh position={[0, 0.5, 0.22]}>
        <boxGeometry args={[1.2, 0.1, 0.01]} />
        <meshStandardMaterial color="#0066FF" />
      </mesh>

      {/* 磁带窗口 */}
      <mesh position={[0, -0.3, 0.21]}>
        <boxGeometry args={[2.2, 0.8, 0.02]} />
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 左磁带轮 */}
      <mesh ref={leftReelRef} position={[-0.6, -0.3, 0.1]}>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* 右磁带轮 */}
      <mesh ref={rightReelRef} position={[0.6, -0.3, 0.1]}>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* 磁带轮中心 */}
      <mesh position={[-0.6, -0.3, 0.18]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 8]} />
        <meshStandardMaterial color="#0066FF" />
      </mesh>

      <mesh position={[0.6, -0.3, 0.18]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 8]} />
        <meshStandardMaterial color="#0066FF" />
      </mesh>

      {/* 装饰螺丝 */}
      <mesh position={[-1.2, 0.7, 0.21]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 6]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
      </mesh>

      <mesh position={[1.2, 0.7, 0.21]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 6]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
      </mesh>

      <mesh position={[-1.2, -0.7, 0.21]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 6]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
      </mesh>

      <mesh position={[1.2, -0.7, 0.21]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 6]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}
