import React, { useEffect } from 'react';
import { World } from './components/World';
import { UI } from './components/UI';
import { network } from './services/network';
import { useGameStore } from './store';
import { NetworkEvent, PlayerState, WorldObject } from './types';

function App() {
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const addObject = useGameStore((state) => state.addObject);
  const setObjects = useGameStore((state) => state.setObjects);

  useEffect(() => {
    // Set up Network Listeners
    
    network.on(NetworkEvent.JOIN, (payload: PlayerState, senderId: string) => {
      console.log('Player joined:', payload.username);
      updatePlayer(senderId, payload);
      
      // If we are already in game, send our state to the new player
      const state = useGameStore.getState();
      if (state.localPlayerId) {
        const myData = state.players[state.localPlayerId];
        // Delay slightly to ensure other side is ready
        setTimeout(() => {
           network.broadcast(NetworkEvent.UPDATE, myData);
        }, 500);
      }
    });

    network.on(NetworkEvent.UPDATE, (payload: Partial<PlayerState>, senderId: string) => {
      updatePlayer(senderId, payload);
    });

    network.on(NetworkEvent.LEAVE, (payload: { id: string }) => {
      removePlayer(payload.id);
    });

    network.on(NetworkEvent.CREATE_OBJECT, (payload: WorldObject) => {
      addObject(payload);
    });

    // Simple sync mechanism: New joiner asks for objects, everyone responds (naive approach, okay for demo)
    // Optimization: Only the "host" or oldest peer should respond, but for broadcast channel, this is fine.
    network.on(NetworkEvent.SYNC_REQUEST, (payload: any, senderId: string) => {
      const state = useGameStore.getState();
      if (state.objects.length > 0) {
         network.broadcast(NetworkEvent.SYNC_RESPONSE, { objects: state.objects });
      }
      // Also send my player data
      if (state.localPlayerId) {
        network.broadcast(NetworkEvent.UPDATE, state.players[state.localPlayerId]);
      }
    });

    network.on(NetworkEvent.SYNC_RESPONSE, (payload: { objects: WorldObject[] }) => {
       // Merge objects (simple set for now)
       if (payload.objects && payload.objects.length > 0) {
          setObjects(payload.objects);
       }
    });

    // Cleanup
    return () => {
      network.disconnect();
    };
  }, [updatePlayer, removePlayer, addObject, setObjects]);

  return (
    <div className="w-full h-screen relative bg-slate-900 overflow-hidden select-none">
      <World />
      <UI />
    </div>
  );
}

export default App;