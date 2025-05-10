import { injectable, inject } from 'inversify';
import { ISignalHubAdapter } from './ISignalHubAdapter';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

// WebRTC fallback event constants
const WEBRTC_EVENTS = {
  FALLBACK_SUGGESTED: 'webrtc-fallback-suggested',
  FALLBACK_NEEDED: 'webrtc-fallback-needed',
  FALLBACK_ACTIVATE: 'webrtc-fallback-activate',
  FALLBACK_ACTIVATED: 'webrtc-fallback-activated',
  RELAY_DATA: 'relay-data'
};

// Room event constants
const ROOM_EVENTS = {
  JOIN: 'join',
  LEAVE: 'leave',
  ROOM_STATE: 'room-state',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left'
};

// WebRTC signaling event constants
const SIGNAL_EVENTS = {
  ICE_CANDIDATE: 'ice-candidate',
  OFFER: 'offer',
  ANSWER: 'answer',
  CONNECTION_STATE: 'connection-state',
  RECONNECT_REQUEST: 'reconnect-request',
  RECONNECT_NEEDED: 'reconnect-needed',
  PEER_CONNECTION_STATE: 'peer-connection-state'
};

/**
 * SignalHub Adapter Implementation
 * Uses WebSocket for signaling exchange and room event broadcasting
 */
@injectable()
export class SignalHubAdapter implements ISignalHubAdapter {
  private socket: WebSocket | null = null;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 2000; // 2 seconds
  
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private connectionStatus = false;
  private currentRoomId: string | null = null;
  private currentPeerId: string | null = null;
  
  // Get API URL from environment or use default
  private readonly apiBaseUrl: string;
  
  constructor(
    @inject(TYPES.EventBus)
    private readonly eventBus: IEventBus,
    @inject(TYPES.ENV_CONFIG)
    env: { API_URL: string }
  ) {
    this.apiBaseUrl = env.API_URL || 'wss://api.echlub.com';
  }
  
  /**
   * Connect to signaling server
   */
  async connect(roomId: string, peerId: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && 
        this.currentRoomId === roomId && this.currentPeerId === peerId) {
      console.log('Already connected to the same room');
      return;
    }
    
    // If there's an existing connection but room or ID is different, disconnect first
    if (this.socket) {
      await this.disconnect();
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        // Use WebSocket connection URL that matches backend specification
        const wsUrl = `${this.apiBaseUrl}/collaboration?roomId=${roomId}&peerId=${peerId}`;
        this.socket = new WebSocket(wsUrl);
        this.currentRoomId = roomId;
        this.currentPeerId = peerId;
        
        this.socket.onopen = () => {
          console.log(`SignalHub connected to ${roomId} as ${peerId}`);
          this.connectionStatus = true;
          this.reconnectAttempts = 0;
          
          // Send join event immediately after connection
          this.joinRoom(roomId, peerId).catch(error => {
            console.error('Error joining room:', error);
          });
          
          resolve();
        };
        
        this.socket.onmessage = this.handleIncomingMessage.bind(this);
        
        this.socket.onclose = (event) => {
          console.log(`SignalHub disconnected: ${event.code} - ${event.reason}`);
          this.connectionStatus = false;
          
          // Attempt to reconnect unless it was an intentional close
          if (!this.isReconnecting && event.code !== 1000) {
            this.attemptReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('SignalHub connection error:', error);
          if (!this.connectionStatus) {
            reject(new Error('Failed to connect to SignalHub'));
          }
        };
      } catch (error) {
        console.error('Error connecting to SignalHub:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Join room
   */
  private async joinRoom(roomId: string, peerId: string): Promise<void> {
    await this.send(ROOM_EVENTS.JOIN, {
      roomId,
      peerId
    });
  }
  
  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts || 
        !this.currentRoomId || !this.currentPeerId) {
      return;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect to SignalHub (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        await this.connect(this.currentRoomId!, this.currentPeerId!);
        this.isReconnecting = false;
        console.log('Successfully reconnected to SignalHub');
        
        // Notify successful reconnection
        this.eventBus.publish({
          type: 'signalhub.reconnected',
          roomId: this.currentRoomId,
          peerId: this.currentPeerId
        });
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        this.isReconnecting = false;
        
        // If there are attempts left, continue reconnecting
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          console.error('Max reconnection attempts reached');
          // Notify reconnection failure
          this.eventBus.publish({
            type: 'signalhub.reconnect-failed',
            roomId: this.currentRoomId,
            peerId: this.currentPeerId
          });
        }
      }
    }, this.reconnectInterval);
  }
  
  /**
   * Disconnect from signaling server
   */
  async disconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connectionStatus = false;
        this.currentRoomId = null;
        this.currentPeerId = null;
        resolve();
        return;
      }
      
      // If there's a room ID and peer ID, send leave event
      if (this.currentRoomId && this.currentPeerId && this.socket.readyState === WebSocket.OPEN) {
        this.send(ROOM_EVENTS.LEAVE, {
          roomId: this.currentRoomId,
          peerId: this.currentPeerId
        }).catch(error => {
          console.error('Error sending leave event:', error);
        });
      }
      
      this.socket.onclose = () => {
        this.connectionStatus = false;
        this.currentRoomId = null;
        this.currentPeerId = null;
        this.socket = null;
        resolve();
      };
      
      this.socket.close();
    });
  }
  
  /**
   * Send message to signaling hub
   */
  async send(channel: string, data: any): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('SignalHub not connected');
    }
    
    const message = {
      type: channel,
      payload: data
    };
    
    this.socket.send(JSON.stringify(message));
  }
  
  /**
   * Handle incoming messages
   */
  private handleIncomingMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const { type, payload } = message;
      
      // Call subscribers for the corresponding channel
      const listeners = this.subscriptions.get(type);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(payload);
          } catch (error) {
            console.error(`Error in SignalHub listener for channel ${type}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error handling SignalHub message:', error);
    }
  }
  
  /**
   * Update connection state
   */
  async updateConnectionState(peerId: string, state: string): Promise<void> {
    await this.send(SIGNAL_EVENTS.CONNECTION_STATE, {
      roomId: this.currentRoomId,
      peerId,
      state
    });
  }
  
  /**
   * Request reconnection with another peer
   */
  async requestReconnect(targetPeerId: string): Promise<void> {
    await this.send(SIGNAL_EVENTS.RECONNECT_REQUEST, {
      roomId: this.currentRoomId,
      from: this.currentPeerId,
      to: targetPeerId
    });
  }
  
  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, callback: (data: any) => void): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);
  }
  
  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string, callback: (data: any) => void): void {
    const listeners = this.subscriptions.get(channel);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }
  
  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connectionStatus;
  }
  
  /**
   * Activate WebRTC fallback mode
   */
  async activateWebRTCFallback(peerId: string): Promise<void> {
    await this.send(WEBRTC_EVENTS.FALLBACK_ACTIVATE, {
      roomId: this.currentRoomId,
      from: this.currentPeerId,
      to: peerId
    });
  }
  
  /**
   * Relay data through server
   */
  async relayData(targetPeerId: string, data: any): Promise<void> {
    await this.send(WEBRTC_EVENTS.RELAY_DATA, {
      roomId: this.currentRoomId,
      from: this.currentPeerId,
      to: targetPeerId,
      payload: data
    });
  }
  
  /**
   * Send ICE candidate
   */
  async sendIceCandidate(targetPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    await this.send(SIGNAL_EVENTS.ICE_CANDIDATE, {
      roomId: this.currentRoomId,
      from: this.currentPeerId,
      to: targetPeerId,
      recipient: targetPeerId,
      candidate
    });
  }
  
  /**
   * Send offer
   */
  async sendOffer(targetPeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    await this.send(SIGNAL_EVENTS.OFFER, {
      roomId: this.currentRoomId,
      from: this.currentPeerId,
      to: targetPeerId,
      recipient: targetPeerId,
      offer
    });
  }
  
  /**
   * Send answer
   */
  async sendAnswer(targetPeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    await this.send(SIGNAL_EVENTS.ANSWER, {
      roomId: this.currentRoomId,
      from: this.currentPeerId,
      to: targetPeerId,
      recipient: targetPeerId,
      answer
    });
  }
  
  /**
   * Subscribe to WebRTC fallback suggestion
   */
  onWebRTCFallbackSuggested(callback: (data: { peerId: string, reason: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_SUGGESTED, callback);
  }
  
  /**
   * Subscribe to WebRTC fallback needed
   */
  onWebRTCFallbackNeeded(callback: (data: { peerId: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_NEEDED, callback);
  }
  
  /**
   * Subscribe to WebRTC fallback activated
   */
  onWebRTCFallbackActivated(callback: (data: { peerId: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_ACTIVATED, callback);
  }
  
  /**
   * Subscribe to relay data
   */
  onRelayData(callback: (data: { from: string, payload: any }) => void): void {
    this.subscribe(WEBRTC_EVENTS.RELAY_DATA, callback);
  }
  
  /**
   * Subscribe to room state
   */
  onRoomState(callback: (data: any) => void): void {
    this.subscribe(ROOM_EVENTS.ROOM_STATE, callback);
  }
  
  /**
   * Subscribe to player joined
   */
  onPlayerJoined(callback: (data: { peerId: string, roomId: string, totalPlayers: number, isRoomOwner: boolean }) => void): void {
    this.subscribe(ROOM_EVENTS.PLAYER_JOINED, callback);
  }
  
  /**
   * Subscribe to player left
   */
  onPlayerLeft(callback: (data: { peerId: string, roomId: string }) => void): void {
    this.subscribe(ROOM_EVENTS.PLAYER_LEFT, callback);
  }
  
  /**
   * Subscribe to ICE candidate
   */
  onIceCandidate(callback: (data: { from: string, candidate: RTCIceCandidateInit }) => void): void {
    this.subscribe(SIGNAL_EVENTS.ICE_CANDIDATE, callback);
  }
  
  /**
   * Subscribe to offer
   */
  onOffer(callback: (data: { from: string, offer: RTCSessionDescriptionInit }) => void): void {
    this.subscribe(SIGNAL_EVENTS.OFFER, callback);
  }
  
  /**
   * Subscribe to answer
   */
  onAnswer(callback: (data: { from: string, answer: RTCSessionDescriptionInit }) => void): void {
    this.subscribe(SIGNAL_EVENTS.ANSWER, callback);
  }
  
  /**
   * Subscribe to reconnect needed
   */
  onReconnectNeeded(callback: (data: { from: string }) => void): void {
    this.subscribe(SIGNAL_EVENTS.RECONNECT_NEEDED, callback);
  }
  
  /**
   * Subscribe to peer connection state
   */
  onPeerConnectionState(callback: (data: { peerId: string, state: string }) => void): void {
    this.subscribe(SIGNAL_EVENTS.PEER_CONNECTION_STATE, callback);
  }
} 