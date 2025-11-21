import React, { useState } from 'react';
import { useGameStore } from '../store';
import { NetworkEvent, PlayerState } from '../types';
import { network } from '../services/network';
import { v4 as uuidv4 } from 'uuid';
import { MousePointer2, Eye, Users, Box } from 'lucide-react';

const generateRandomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16);

export const UI: React.FC = () => {
  const { localPlayerId, setLocalPlayerId, isThirdPerson, toggleCameraMode, players, objects } = useGameStore();
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (!username.trim()) return;
    
    const id = uuidv4();
    const color = generateRandomColor();
    
    // Init Network
    network.setPlayerId(id);
    
    // Initial Player State
    const playerData = {
      id,
      username,
      color,
      position: [0, 0, 0], // x, y, z
      rotation: 0
    };

    // Set Local
    setLocalPlayerId(id);
    useGameStore.getState().updatePlayer(id, playerData);

    // Broadcast Join
    network.broadcast(NetworkEvent.JOIN, playerData);
    
    // Request sync from others (in case we joined late)
    network.broadcast(NetworkEvent.SYNC_REQUEST, {});

    setJoined(true);
  };

  if (!joined) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Co-World 3D</h1>
          <p className="text-slate-400 mb-6">A multiplayer creative space. Open this URL in multiple tabs to test networking!</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Choose Avatar Name</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter username..."
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <button 
              onClick={handleJoin}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Enter World
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white pointer-events-auto">
          <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
            <Users size={18} /> Players ({Object.keys(players).length})
          </h2>
          <ul className="text-sm space-y-1">
            {(Object.values(players) as PlayerState[]).map(p => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className={p.id === localPlayerId ? "font-bold text-blue-400" : "text-slate-300"}>
                  {p.username} {p.id === localPlayerId && '(You)'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-sm font-medium">
            Objects: {objects.length}
          </div>
        </div>
      </div>

      {/* Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-2 h-2 bg-white/80 rounded-full ring-2 ring-black/20" />
      </div>

      {/* Bottom Controls */}
      <div className="flex items-end justify-between">
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-slate-300 text-sm pointer-events-auto max-w-md">
          <div className="flex items-center gap-2 mb-2 font-bold text-white">
            <MousePointer2 size={16} /> Controls
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <span>W, A, S, D</span> <span className="text-white">Move</span>
            <span>Space</span> <span className="text-white">Jump</span>
            <span>Shift + Click</span> <span className="text-white">Spawn Object</span>
            <span>Click (on canvas)</span> <span className="text-white">Lock Mouse</span>
            <span>ESC</span> <span className="text-white">Unlock Mouse</span>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
           <button 
            onClick={toggleCameraMode}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Eye size={18} />
            {isThirdPerson ? '3rd Person' : '1st Person'}
          </button>
        </div>
      </div>
    </div>
  );
};