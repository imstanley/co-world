export type Vector3Array = [number, number, number];

export interface PlayerState {
  id: string;
  position: Vector3Array;
  rotation: number; // Y-axis rotation
  color: string;
  username: string;
}

export interface WorldObject {
  id: string;
  type: 'cube' | 'sphere' | 'pyramid';
  position: Vector3Array;
  color: string;
  ownerId: string;
}

export enum NetworkEvent {
  JOIN = 'JOIN',
  UPDATE = 'UPDATE',
  LEAVE = 'LEAVE',
  CREATE_OBJECT = 'CREATE_OBJECT',
  SYNC_REQUEST = 'SYNC_REQUEST',
  SYNC_RESPONSE = 'SYNC_RESPONSE',
}

export interface NetworkMessage {
  type: NetworkEvent;
  payload: any;
  senderId: string;
}