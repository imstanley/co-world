import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PlayerState } from '../types';
import { Avatar } from './Avatar';
import { Group, Vector3 } from 'three';

interface RemotePlayerProps {
  player: PlayerState;
}

export const RemotePlayer: React.FC<RemotePlayerProps> = ({ player }) => {
  const groupRef = useRef<Group>(null);
  const targetPosition = useRef(new Vector3(...player.position));
  const targetRotation = useRef(player.rotation);

  // Update targets when props change
  targetPosition.current.set(...player.position);
  targetRotation.current = player.rotation;

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Interpolate position for smooth movement (LERP)
      groupRef.current.position.lerp(targetPosition.current, 10 * delta);
      
      // Interpolate rotation (shortest path logic omitted for simplicity, simple lerp)
      // For robust rotation interpolation, quaternions are better, but Euler Y is fine here.
      let rotDiff = targetRotation.current - groupRef.current.rotation.y;
      // Normalize angle to -PI to PI to take shortest path
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      
      groupRef.current.rotation.y += rotDiff * 10 * delta;
    }
  });

  return (
    <group ref={groupRef} position={player.position} rotation={[0, player.rotation, 0]}>
      <Avatar color={player.color} username={player.username} />
    </group>
  );
};