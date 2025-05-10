import { ISignalHubAdapter } from "../../infrastructure/adapters/ISignalHubAdapter";
import { injectable } from "inversify";

/**
 * Mock signal hub adapter implementation for testing
 */
@injectable()
export class MockSignalHubAdapter implements ISignalHubAdapter {
  private onIceCandidateHandler: ((data: { from: string, candidate: RTCIceCandidateInit }) => void) | null = null;
  private onOfferHandler: ((data: { from: string, offer: RTCSessionDescriptionInit }) => void) | null = null;
  private onAnswerHandler: ((data: { from: string, answer: RTCSessionDescriptionInit }) => void) | null = null;
  private onReconnectNeededHandler: ((data: { from: string }) => void) | null = null;
  private onPeerConnectionStateHandler: ((data: { peerId: string, state: string }) => void) | null = null;
  private onWebRTCFallbackNeededHandler: ((data: { peerId: string }) => void) | null = null;
  
  // Use arrays to properly store all handlers
  private playerJoinedHandlers: ((data: any) => void)[] = [];
  private playerLeftHandlers: ((data: any) => void)[] = [];
  private roomStateHandlers: ((data: any) => void)[] = [];
  private webRTCFallbackSuggestedHandlers: ((data: any) => void)[] = [];
  private webRTCFallbackNeededHandlers: ((data: any) => void)[] = [];
  private webRTCFallbackActivatedHandlers: ((data: any) => void)[] = [];
  private reconnectNeededHandlers: ((data: any) => void)[] = [];
  private peerConnectionStateHandlers: ((data: any) => void)[] = [];
  private relayDataHandlers: ((data: any) => void)[] = [];
  
  private connected = true;

  /**
   * Connect to signaling server
   */
  async connect(_roomId: string, _peerId: string): Promise<void> {
    // Simulate connection to signaling server
    this.connected = true;
  }
  
  /**
   * Disconnect from signaling server
   */
  async disconnect(): Promise<void> {
    // Simulate disconnection
    this.connected = false;
  }
  
  /**
   * Send message to signaling hub
   */
  async send(_channel: string, _data: any): Promise<void> {
    // Simulate sending message
  }
  
  /**
   * Subscribe to a specific channel
   */
  subscribe(channel: string, callback: (data: any) => void): void {
    // Simulate subscription
    switch (channel) {
      case 'player-joined':
        this.playerJoinedHandlers.push(callback);
        break;
      case 'player-left':
        this.playerLeftHandlers.push(callback);
        break;
      case 'room-state':
        this.roomStateHandlers.push(callback);
        break;
      case 'webrtc-fallback-suggested':
        this.webRTCFallbackSuggestedHandlers.push(callback);
        break;
      case 'webrtc-fallback-needed':
        this.webRTCFallbackNeededHandlers.push(callback);
        break;
      case 'webrtc-fallback-activated':
        this.webRTCFallbackActivatedHandlers.push(callback);
        break;
      case 'reconnect-needed':
        this.reconnectNeededHandlers.push(callback);
        break;
      case 'peer-connection-state':
        this.peerConnectionStateHandlers.push(callback);
        break;
      case 'relay-data':
        this.relayDataHandlers.push(callback);
        break;
    }
  }
  
  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channel: string, callback: (data: any) => void): void {
    // Simulate unsubscription
    switch (channel) {
      case 'player-joined':
        this.playerJoinedHandlers = this.playerJoinedHandlers.filter(h => h !== callback);
        break;
      case 'player-left':
        this.playerLeftHandlers = this.playerLeftHandlers.filter(h => h !== callback);
        break;
      case 'room-state':
        this.roomStateHandlers = this.roomStateHandlers.filter(h => h !== callback);
        break;
      case 'webrtc-fallback-suggested':
        this.webRTCFallbackSuggestedHandlers = this.webRTCFallbackSuggestedHandlers.filter(h => h !== callback);
        break;
      case 'webrtc-fallback-needed':
        this.webRTCFallbackNeededHandlers = this.webRTCFallbackNeededHandlers.filter(h => h !== callback);
        break;
      case 'webrtc-fallback-activated':
        this.webRTCFallbackActivatedHandlers = this.webRTCFallbackActivatedHandlers.filter(h => h !== callback);
        break;
      case 'reconnect-needed':
        this.reconnectNeededHandlers = this.reconnectNeededHandlers.filter(h => h !== callback);
        break;
      case 'peer-connection-state':
        this.peerConnectionStateHandlers = this.peerConnectionStateHandlers.filter(h => h !== callback);
        break;
      case 'relay-data':
        this.relayDataHandlers = this.relayDataHandlers.filter(h => h !== callback);
        break;
    }
  }
  
  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Send ICE candidate
   */
  async sendIceCandidate(_recipient: string, candidate: RTCIceCandidateInit): Promise<void> {
    // Simulate sending ICE candidate
    if (this.onIceCandidateHandler) {
      this.onIceCandidateHandler({
        from: 'local-peer-id',
        candidate
      });
    }
  }
  
  /**
   * Send offer
   */
  async sendOffer(_recipient: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    // Simulate sending offer
    if (this.onOfferHandler) {
      this.onOfferHandler({
        from: 'local-peer-id',
        offer: sdp
      });
    }
  }
  
  /**
   * Send answer
   */
  async sendAnswer(_recipient: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    // Simulate sending answer
    if (this.onAnswerHandler) {
      this.onAnswerHandler({
        from: 'local-peer-id',
        answer: sdp
      });
    }
  }
  
  /**
   * Update connection state
   */
  async updateConnectionState(peerId: string, state: string): Promise<void> {
    // Simulate updating connection state
    if (this.onPeerConnectionStateHandler) {
      this.onPeerConnectionStateHandler({
        peerId,
        state
      });
    }
    
    // Also notify via array-based handlers
    this.peerConnectionStateHandlers.forEach(handler => handler({
      peerId,
      state
    }));
  }
  
  /**
   * Set handler for ICE candidate events
   */
  onIceCandidate(callback: (data: { from: string, candidate: RTCIceCandidateInit }) => void): void {
    this.onIceCandidateHandler = callback;
  }
  
  /**
   * Set handler for offer events
   */
  onOffer(callback: (data: { from: string, offer: RTCSessionDescriptionInit }) => void): void {
    this.onOfferHandler = callback;
  }
  
  /**
   * Set handler for answer events
   */
  onAnswer(callback: (data: { from: string, answer: RTCSessionDescriptionInit }) => void): void {
    this.onAnswerHandler = callback;
  }
  
  /**
   * Set handler for reconnect needed events
   */
  onReconnectNeeded(callback: (data: { from: string }) => void): void {
    this.onReconnectNeededHandler = callback;
    this.reconnectNeededHandlers.push(callback);
  }
  
  /**
   * Set handler for peer connection state events
   */
  onPeerConnectionState(callback: (data: { peerId: string, state: string }) => void): void {
    this.onPeerConnectionStateHandler = callback;
    this.peerConnectionStateHandlers.push(callback);
  }
  
  /**
   * Request reconnection with a peer
   */
  async requestReconnect(peerId: string): Promise<void> {
    // Simulate reconnect request
    if (this.onReconnectNeededHandler) {
      this.onReconnectNeededHandler({
        from: peerId
      });
    }
    
    // Also notify via array-based handlers
    this.reconnectNeededHandlers.forEach(handler => handler({
      from: peerId
    }));
  }
  
  /**
   * Set handler for WebRTC fallback needed events
   */
  onWebRTCFallbackNeeded(callback: (data: { peerId: string }) => void): void {
    this.onWebRTCFallbackNeededHandler = callback;
    this.webRTCFallbackNeededHandlers.push(callback);
  }
  
  /**
   * Activate WebRTC fallback
   */
  async activateWebRTCFallback(peerId: string): Promise<void> {
    // Simulate WebRTC fallback activation
    if (this.onWebRTCFallbackNeededHandler) {
      this.onWebRTCFallbackNeededHandler({
        peerId
      });
    }
    
    // Also notify via array-based handlers
    this.webRTCFallbackNeededHandlers.forEach(handler => handler({
      peerId
    }));
  }
  
  /**
   * Relay data to other peers
   */
  async relayData(_peerId: string, data: any): Promise<void> {
    // Simulate data relay
    this.relayDataHandlers.forEach(handler => handler({
      from: 'local-peer-id',
      payload: data
    }));
  }
  
  /**
   * Subscribe to room state events
   */
  onRoomState(callback: (data: any) => void): void {
    this.roomStateHandlers.push(callback);
  }
  
  /**
   * Subscribe to player joined events
   */
  onPlayerJoined(callback: (data: { peerId: string, roomId: string, totalPlayers: number, isRoomOwner: boolean }) => void): void {
    this.playerJoinedHandlers.push(callback);
  }
  
  /**
   * Subscribe to player left events
   */
  onPlayerLeft(callback: (data: { peerId: string, roomId: string }) => void): void {
    this.playerLeftHandlers.push(callback);
  }
  
  /**
   * Subscribe to WebRTC fallback suggestion events
   */
  onWebRTCFallbackSuggested(callback: (data: { peerId: string, reason: string }) => void): void {
    this.webRTCFallbackSuggestedHandlers.push(callback);
  }
  
  /**
   * Subscribe to WebRTC fallback activation events
   */
  onWebRTCFallbackActivated(callback: (data: { peerId: string }) => void): void {
    this.webRTCFallbackActivatedHandlers.push(callback);
  }
  
  /**
   * Subscribe to relay data events
   */
  onRelayData(callback: (data: { from: string, payload: any }) => void): void {
    this.relayDataHandlers.push(callback);
  }

  // Mock methods for testing
  public mockPlayerJoined(data: { peerId: string, roomId: string, username: string, totalPlayers: number, isRoomOwner: boolean }): void {
    this.playerJoinedHandlers.forEach(handler => handler(data));
  }
  
  public mockPlayerLeft(data: { peerId: string, roomId: string }): void {
    this.playerLeftHandlers.forEach(handler => handler(data));
  }
  
  public mockRoomState(data: any): void {
    this.roomStateHandlers.forEach(handler => handler(data));
  }
  
  public mockWebRTCFallbackSuggested(data: { peerId: string, reason: string }): void {
    this.webRTCFallbackSuggestedHandlers.forEach(handler => handler(data));
  }
  
  public mockWebRTCFallbackNeeded(data: { peerId: string }): void {
    this.webRTCFallbackNeededHandlers.forEach(handler => handler(data));
  }
  
  public mockWebRTCFallbackActivated(data: { peerId: string }): void {
    this.webRTCFallbackActivatedHandlers.forEach(handler => handler(data));
  }
} 