import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';

interface AvatarProps {
  color: string;
  username: string;
  isLocal?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ color, username, isLocal = false }) => {
  
  const bodyColor = useMemo(() => color, [color]);

  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.4, 1, 8, 16]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* Eyes/Visor to show direction */}
      <mesh position={[0, 1.1, 0.3]}>
        <boxGeometry args={[0.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Name Tag */}
      {!isLocal && (
        <Html position={[0, 2.2, 0]} center distanceFactor={10}>
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs whitespace-nowrap backdrop-blur-sm select-none">
            {username}
          </div>
        </Html>
      )}
    </group>
  );
};