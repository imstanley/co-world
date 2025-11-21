import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Sky, Grid, Stars, Environment } from '@react-three/drei';
import { useGameStore } from '../store';
import { LocalPlayer } from './LocalPlayer';
import { RemotePlayer } from './RemotePlayer';
import { WorldObject, NetworkEvent, Vector3Array, PlayerState } from '../types';
import { network } from '../services/network';
import * as THREE from 'three';

// Component to render user created objects
const ObjectsRenderer = () => {
  const objects = useGameStore((state) => state.objects);

  return (
    <group>
      {objects.map((obj) => (
        <mesh key={obj.id} position={new THREE.Vector3(...obj.position)} castShadow receiveShadow>
          {obj.type === 'cube' && <boxGeometry args={[1, 1, 1]} />}
          {obj.type === 'sphere' && <sphereGeometry args={[0.6, 16, 16]} />}
          {obj.type === 'pyramid' && <coneGeometry args={[0.6, 1, 4]} />}
          <meshStandardMaterial color={obj.color} />
        </mesh>
      ))}
    </group>
  );
};

export const World: React.FC = () => {
  const players = useGameStore((state) => state.players);
  const localPlayerId = useGameStore((state) => state.localPlayerId);

  const otherPlayers = (Object.values(players) as PlayerState[]).filter(p => p.id !== localPlayerId);

  const handleFloorClick = (e: any) => {
    if (!localPlayerId || !e.point) return;
    // Only spawn if holding 'Shift' key to avoid accidental clicks while locking pointer
    if (!e.shiftKey) return;

    const pos: Vector3Array = [e.point.x, e.point.y + 0.5, e.point.z];
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
    const types: WorldObject['type'][] = ['cube', 'sphere', 'pyramid'];
    
    const newObj: WorldObject = {
      id: crypto.randomUUID(),
      type: types[Math.floor(Math.random() * types.length)],
      position: pos,
      color: colors[Math.floor(Math.random() * colors.length)],
      ownerId: localPlayerId
    };

    // Update local store
    useGameStore.getState().addObject(newObj);
    // Broadcast
    network.broadcast(NetworkEvent.CREATE_OBJECT, newObj);
  };

  return (
    <Canvas shadows camera={{ fov: 75 }}>
      <Sky sunPosition={[100, 20, 100]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 20, 5]} intensity={1.5} castShadow />

      {/* Environment floor */}
      <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#666" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow onClick={handleFloorClick}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Players */}
      {localPlayerId && <LocalPlayer />}
      {otherPlayers.map(p => (
        <RemotePlayer key={p.id} player={p} />
      ))}

      {/* Interactive Objects */}
      <ObjectsRenderer />

      <PointerLockControls />
    </Canvas>
  );
};