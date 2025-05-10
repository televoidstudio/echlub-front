import 'reflect-metadata';
import { MockSignalHubAdapter } from './MockSignalHubAdapter';

describe('MockSignalHubAdapter (used for testing coverage)', () => {
  let adapter: MockSignalHubAdapter;
  
  beforeEach(() => {
    adapter = new MockSignalHubAdapter();
  });
  
  describe('connect/disconnect', () => {
    test('should connect and disconnect successfully', async () => {
      const roomId = 'test-room-id';
      const peerId = 'test-peer-id';
      
      // Connect
      await adapter.connect(roomId, peerId);
      expect(adapter.isConnected()).toBe(true);
      
      // Disconnect
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });
  
  describe('signaling methods', () => {
    test('should handle ice candidates', async () => {
      const targetPeerId = 'target-peer';
      const candidate = { candidate: 'test-candidate' };
      
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onIceCandidate(handlerSpy);
      
      // Send ice candidate
      await adapter.sendIceCandidate(targetPeerId, candidate);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          candidate: expect.any(Object)
        })
      );
    });
    
    test('should handle offers', async () => {
      const targetPeerId = 'target-peer';
      const offer = { type: 'offer' as RTCSdpType, sdp: 'test-sdp' };
      
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onOffer(handlerSpy);
      
      // Send offer
      await adapter.sendOffer(targetPeerId, offer);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          offer: expect.any(Object)
        })
      );
    });
    
    test('should handle answers', async () => {
      const targetPeerId = 'target-peer';
      const answer = { type: 'answer' as RTCSdpType, sdp: 'test-sdp' };
      
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onAnswer(handlerSpy);
      
      // Send answer
      await adapter.sendAnswer(targetPeerId, answer);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          answer: expect.any(Object)
        })
      );
    });
  });
  
  describe('player events', () => {
    test('should handle player joined events', () => {
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onPlayerJoined(handlerSpy);
      
      // Simulate player joined event
      const playerData = {
        peerId: 'joined-peer-id',
        roomId: 'test-room',
        username: 'TestUser',
        totalPlayers: 2,
        isRoomOwner: false
      };
      
      // Call the handler function directly
      adapter.mockPlayerJoined(playerData);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(playerData);
    });
    
    test('should handle player left events', () => {
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onPlayerLeft(handlerSpy);
      
      // Simulate player left event
      const playerData = {
        peerId: 'left-peer-id',
        roomId: 'test-room'
      };
      
      // Call the handler function directly
      adapter.mockPlayerLeft(playerData);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(playerData);
    });
  });
  
  describe('connection state', () => {
    test('should handle connection state updates', async () => {
      // Setup
      const peerId = 'test-peer';
      const state = 'connected';
      
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onPeerConnectionState(handlerSpy);
      
      // Update connection state
      await adapter.updateConnectionState(peerId, state);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          peerId,
          state
        })
      );
    });
  });
  
  describe('WebRTC fallback', () => {
    test('should handle WebRTC fallback activation', async () => {
      // Setup
      const peerId = 'test-peer';
      
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onWebRTCFallbackNeeded(handlerSpy);
      
      // Activate WebRTC fallback
      await adapter.activateWebRTCFallback(peerId);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          peerId
        })
      );
    });
    
    test('should handle WebRTC fallback suggestion', () => {
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onWebRTCFallbackSuggested(handlerSpy);
      
      // Simulate fallback suggested event data
      const data = {
        peerId: 'test-peer',
        reason: 'connection-timeout'
      };
      
      // Manually trigger the event using public method
      adapter.mockWebRTCFallbackSuggested(data);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(data);
    });
    
    test('should handle WebRTC fallback activated', () => {
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onWebRTCFallbackActivated(handlerSpy);
      
      // Simulate fallback activated event data
      const data = {
        peerId: 'test-peer'
      };
      
      // Manually trigger the event using public method
      adapter.mockWebRTCFallbackActivated(data);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(data);
    });
    
    test('should handle reconnect requests', async () => {
      // Setup
      const peerId = 'test-peer';
      
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onReconnectNeeded(handlerSpy);
      
      // Request reconnect
      await adapter.requestReconnect(peerId);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: peerId
        })
      );
    });
    
    test('should handle relay data', async () => {
      // Setup
      const peerId = 'test-peer';
      const data = { type: 'test-data', payload: 'test-payload' };
      
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onRelayData(handlerSpy);
      
      // Relay data
      await adapter.relayData(peerId, data);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          payload: data
        })
      );
    });
  });
  
  describe('room state', () => {
    test('should handle room state events', () => {
      // Create handler
      const handlerSpy = jest.fn();
      adapter.onRoomState(handlerSpy);
      
      // Simulate room state event
      const roomState = {
        roomId: 'test-room',
        peers: ['peer1', 'peer2'],
        owner: 'peer1'
      };
      
      // Call the handler function directly
      adapter.mockRoomState(roomState);
      
      // Verify handler was called
      expect(handlerSpy).toHaveBeenCalledWith(roomState);
    });
  });
}); 