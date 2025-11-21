import { create } from 'zustand';
import { PlayerState, WorldObject, Vector3Array } from './types';

interface GameStore {
  localPlayerId: string | null;
  players: Record<string, PlayerState>;
  objects: WorldObject[];
  isThirdPerson: boolean;
  
  // Actions
  setLocalPlayerId: (id: string) => void;
  updatePlayer: (id: string, data: Partial<PlayerState>) => void;
  removePlayer: (id: string) => void;
  addObject: (obj: WorldObject) => void;
  toggleCameraMode: () => void;
  setObjects: (objects: WorldObject[]) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  localPlayerId: null,
  players: {},
  objects: [],
  isThirdPerson: true,

  setLocalPlayerId: (id) => set({ localPlayerId: id }),

  updatePlayer: (id, data) => set((state) => {
    const existing = state.players[id];
    // If player doesn't exist and we are receiving an update (likely from network), create them
    if (!existing) {
      // Requires full state for creation, but partial is allowed for updates.
      // In a real app, we'd strictly separate Join vs Update events.
      // For this demo, we merge.
      if (!data.position) return state; 
      return {
        players: {
          ...state.players,
          [id]: {
            id,
            username: 'Guest',
            color: '#cccccc',
            position: [0, 0, 0],
            rotation: 0,
            ...data
          } as PlayerState
        }
      };
    }
    
    return {
      players: {
        ...state.players,
        [id]: { ...existing, ...data }
      }
    };
  }),

  removePlayer: (id) => set((state) => {
    const newPlayers = { ...state.players };
    delete newPlayers[id];
    return { players: newPlayers };
  }),

  addObject: (obj) => set((state) => ({
    objects: [...state.objects, obj]
  })),

  setObjects: (objects) => set({ objects }),

  toggleCameraMode: () => set((state) => ({ isThirdPerson: !state.isThirdPerson })),
}));