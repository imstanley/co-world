import { NetworkEvent, NetworkMessage, PlayerState, WorldObject } from '../types';

// Using BroadcastChannel for serverless multi-tab multiplayer experience.
// In a real production app, this would be replaced by WebSockets or WebRTC (PeerJS).
class NetworkManager {
  private channel: BroadcastChannel;
  private handlers: Map<NetworkEvent, Function[]> = new Map();
  public playerId: string | null = null;

  constructor() {
    this.channel = new BroadcastChannel('co-world-channel');
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data as NetworkMessage);
    };
  }

  public setPlayerId(id: string) {
    this.playerId = id;
  }

  public on(event: NetworkEvent, callback: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)?.push(callback);
  }

  public off(event: NetworkEvent, callback: Function) {
    const callbacks = this.handlers.get(event);
    if (callbacks) {
      this.handlers.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  private handleMessage(message: NetworkMessage) {
    // Ignore messages from self
    if (message.senderId === this.playerId) return;

    const callbacks = this.handlers.get(message.type);
    if (callbacks) {
      callbacks.forEach(cb => cb(message.payload, message.senderId));
    }
  }

  public broadcast(type: NetworkEvent, payload: any) {
    if (!this.playerId) return;
    const message: NetworkMessage = {
      type,
      payload,
      senderId: this.playerId
    };
    this.channel.postMessage(message);
  }

  public disconnect() {
    this.broadcast(NetworkEvent.LEAVE, { id: this.playerId });
    this.channel.close();
  }
}

export const network = new NetworkManager();