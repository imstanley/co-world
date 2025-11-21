import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { useGameStore } from '../store';
import { network } from '../services/network';
import { Avatar } from './Avatar';
import { NetworkEvent } from '../types';

const SPEED = 5;
const JUMP_FORCE = 8;
const GRAVITY = 20;

export const LocalPlayer: React.FC = () => {
  const { camera } = useThree();
  const { localPlayerId, players, updatePlayer, isThirdPerson } = useGameStore();
  const playerRef = useRef<Group>(null);
  
  // Physics state
  const velocity = useRef(new Vector3(0, 0, 0));
  const isGrounded = useRef(true);
  
  // Input state
  const keys = useRef<{ [key: string]: boolean }>({});

  const localData = localPlayerId ? players[localPlayerId] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Broadcast position periodically
  useEffect(() => {
    if (!localPlayerId) return;
    
    const interval = setInterval(() => {
      if (playerRef.current) {
        const pos: [number, number, number] = [
          playerRef.current.position.x,
          playerRef.current.position.y,
          playerRef.current.position.z
        ];
        const rot = playerRef.current.rotation.y;

        network.broadcast(NetworkEvent.UPDATE, {
          position: pos,
          rotation: rot
        });
      }
    }, 50); // 20 ticks per second

    return () => clearInterval(interval);
  }, [localPlayerId]);

  useFrame((state, delta) => {
    if (!playerRef.current || !localData) return;

    const group = playerRef.current;
    
    // 1. Handle Rotation (Locked to camera look direction in a simple way)
    // We get the camera's forward vector projected on XZ plane
    const camForward = new Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    const camRight = new Vector3();
    camRight.crossVectors(camForward, new Vector3(0, 1, 0));

    // 2. Calculate Movement Direction
    const moveDir = new Vector3(0, 0, 0);
    if (keys.current['KeyW']) moveDir.add(camForward);
    if (keys.current['KeyS']) moveDir.sub(camForward);
    if (keys.current['KeyD']) moveDir.add(camRight);
    if (keys.current['KeyA']) moveDir.sub(camRight);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      // Rotate character to face movement direction
      // Smooth rotation could go here
      const targetRot = Math.atan2(moveDir.x, moveDir.z);
      group.rotation.y = targetRot;
    }

    // 3. Apply Movement Velocity
    velocity.current.x = moveDir.x * SPEED;
    velocity.current.z = moveDir.z * SPEED;

    // 4. Gravity & Jumping
    if (isGrounded.current) {
      if (keys.current['Space']) {
        velocity.current.y = JUMP_FORCE;
        isGrounded.current = false;
      } else {
        velocity.current.y = 0;
      }
    } else {
      velocity.current.y -= GRAVITY * delta;
    }

    // 5. Apply Velocity to Position
    group.position.x += velocity.current.x * delta;
    group.position.y += velocity.current.y * delta;
    group.position.z += velocity.current.z * delta;

    // 6. Floor Collision (Simple plane at y=0)
    if (group.position.y < 0) {
      group.position.y = 0;
      velocity.current.y = 0;
      isGrounded.current = true;
    }

    // 7. Update Store (Local Only) for immediate feedback
    // We don't set store every frame to avoid react render thrashing, 
    // but we update the ref for the next network packet.
    
    // 8. Camera Follow Logic
    const targetPos = group.position.clone();
    targetPos.y += 1.5; // Look at head height

    if (isThirdPerson) {
      // Third Person: Camera behind player
      // Calculate offset based on camera angle (simple orbital logic handled by PointerLock usually, 
      // but here we manually position to keep it "gamey")
      
      // Actually, simpler: Let the camera float but follow the player position
      // We need to maintain the camera's current rotation but move it to the player.
      
      // A common simple TPS approach:
      // Camera is at a fixed offset relative to player rotation? 
      // No, standard TPS allows looking around freely.
      // Since we are using PointerLockControls (in World.tsx), the camera rotates itself.
      // We just need to move the camera to the player + offset.
      
      // Get current camera direction reversed
      const camDir = new Vector3();
      camera.getWorldDirection(camDir);
      const offset = camDir.multiplyScalar(-4); // 4 units back
      
      camera.position.lerp(targetPos.add(offset), 0.2);
    } else {
      // First Person
      const fpsPos = group.position.clone().add(new Vector3(0, 1.6, 0)); // Eye level
      // Move camera slightly in front of face to avoid clipping geometry
      const forward = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), group.rotation.y);
      fpsPos.add(forward.multiplyScalar(0.2)); 
      
      camera.position.copy(fpsPos);
    }
  });

  if (!localData) return null;

  return (
    <group ref={playerRef} position={new Vector3(...localData.position)}>
      {isThirdPerson && (
        <Avatar color={localData.color} username={localData.username} isLocal />
      )}
    </group>
  );
};