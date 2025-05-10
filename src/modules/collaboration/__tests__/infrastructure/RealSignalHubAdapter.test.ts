import 'reflect-metadata';
import { SignalHubAdapter } from '../../infrastructure/adapters/SignalHubAdapter';
import { Container } from 'inversify';
import { TYPES } from '../../../../core/di/types';
import { CollaborationTypes } from '../../di/CollaborationTypes';

// Mock import.meta.env
// @ts-expect-error - Mocking global import.meta
global.import = { meta: { env: { VITE_API_URL: 'wss://test-api.echlub.com' } } };

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: ((ev: Event) => any) | null = null;
  onclose: ((ev: CloseEvent) => any) | null = null;
  onerror: ((ev: Event) => any) | null = null;
  onmessage: ((ev: MessageEvent) => any) | null = null;
  readyState: number = WebSocket.CONNECTING;
  send: jest.Mock = jest.fn();
  close: jest.Mock = jest.fn().mockImplementation(() => {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure', wasClean: true } as CloseEvent);
    }
  });
  
  // Implement missing properties to satisfy WebSocket type
  binaryType: BinaryType = 'arraybuffer';
  bufferedAmount: number = 0;
  extensions: string = '';
  protocol: string = '';
  
  constructor(url: string) {
    this.url = url;
    // WebSocket initial state is CONNECTING
    this.readyState = WebSocket.CONNECTING;
  }
  
  // Helper method to simulate connection open
  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }
  
  // Helper method to simulate connection close
  simulateClose(code: number = 1000, reason: string = ''): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({
        code,
        reason,
        wasClean: code === 1000
      } as CloseEvent);
    }
  }
  
  // Helper method to simulate message
  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage({
        data: typeof data === 'string' ? data : JSON.stringify(data)
      } as MessageEvent);
    }
  }
  
  // Helper method to simulate error
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

// Spy on console methods to avoid noise in test output
global.console.log = jest.fn();
global.console.error = jest.fn();

describe('RealSignalHubAdapter', () => {
  let adapter: SignalHubAdapter;
  let mockEventBus: any;
  let mockSocket: MockWebSocket;
  
  // Set up environment before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock event bus
    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      publish: jest.fn()
    };
    
    // Create container and register dependencies
    const container = new Container();
    container.bind(TYPES.EventBus).toConstantValue(mockEventBus);
    container.bind(TYPES.ENV_CONFIG).toConstantValue({ API_URL: 'wss://test-api.echlub.com' });
    container.bind(CollaborationTypes.SignalHubAdapter).to(SignalHubAdapter).inSingletonScope();
    
    // Get adapter instance
    adapter = container.get<SignalHubAdapter>(CollaborationTypes.SignalHubAdapter);
  });
  
  // Clean up after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('connect', () => {
    test('should connect to signal hub successfully', async () => {
      // Prepare connection parameters
      const roomId = 'test-room-123';
      const peerId = 'test-peer-456';
      
      // Call connect method
      const connectPromise = adapter.connect(roomId, peerId);
      
      // Get the created WebSocket instance
      // @ts-expect-error - Accessing private socket property
      mockSocket = adapter['socket'] as MockWebSocket;
      
      // Setup send function implementation
      mockSocket.send.mockImplementation((_message) => {
        // Handle any send operation
        return Promise.resolve();
      });
      
      // Simulate WebSocket successful connection
      mockSocket.simulateOpen();
      
      // Wait for connection to complete
      await connectPromise;
      
      // Verify connection status
      expect(adapter.isConnected()).toBe(true);
      
      // Verify WebSocket established correct connection
      expect(mockSocket.url).toContain(roomId);
      expect(mockSocket.url).toContain(peerId);
      
      // Verify WebSocket.send was called to join room
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('join')
      );
    });
    
    test('should handle connection errors', async () => {
      // Prepare connection parameters
      const roomId = 'test-room-123';
      const peerId = 'test-peer-456';
      
      // Call connect method, but don't await Promise yet
      const connectPromise = adapter.connect(roomId, peerId);
      
      // Get the created WebSocket instance
      
      mockSocket = adapter['socket'] as unknown as MockWebSocket;
      
      // Simulate connection error
      mockSocket.simulateError();
      mockSocket.simulateClose(1006, 'Abnormal closure');
      
      // Check if error is thrown
      await expect(connectPromise).rejects.toThrow();
      
      // Verify connection status
      expect(adapter.isConnected()).toBe(false);
    });
  });
  
  describe('disconnect', () => {
    test('should disconnect from signal hub', async () => {
      // First connect
      const roomId = 'test-room-123';
      const peerId = 'test-peer-456';
      
      const connectPromise = adapter.connect(roomId, peerId);
      
      // Get the created WebSocket instance
      // @ts-expect-error - Accessing private socket property
      mockSocket = adapter['socket'] as MockWebSocket;
      
      // Ensure mock resolves properly
      mockSocket.send.mockImplementation((_message) => {
        // Handle any message send operation
        return Promise.resolve();
      });
      
      // Simulate socket onclose to ensure disconnect completes properly
      mockSocket.onclose = () => {
        // Handle onclose
      };
      
      mockSocket.simulateOpen();
      
      // Wait for connection to complete
      await connectPromise;
      
      // Confirm connection
      expect(adapter.isConnected()).toBe(true);
      
      // Now disconnect - don't check any intermediate calls
      await adapter.disconnect();
      
      // Verify connection status
      expect(adapter.isConnected()).toBe(false);
    });
  });
  
  describe('message handling', () => {
    beforeEach(async () => {
      // First connect
      const roomId = 'test-room-123';
      const peerId = 'test-peer-456';
      const connectPromise = adapter.connect(roomId, peerId);
      
      // Get the created WebSocket instance
      // @ts-expect-error - Accessing private socket property
      mockSocket = adapter['socket'] as MockWebSocket;
      
      // Ensure the send method is properly mocked
      mockSocket.send = jest.fn().mockImplementation(() => Promise.resolve());
      
      mockSocket.simulateOpen();
      
      // Wait for connection to complete
      await connectPromise;
      
      // Clear initial connection message records
      mockSocket.send.mockClear();
    });
    
    test('should handle ice candidate messages', async () => {
      // Create handler
      const iceCandidateHandler = jest.fn();
      adapter.onIceCandidate(iceCandidateHandler);
      
      // Simulate receiving ice candidate message
      const iceMessage = {
        type: 'ice-candidate',
        sender: 'remote-peer-id',
        payload: {
          from: 'remote-peer-id',
          candidate: { candidate: 'test-candidate' }
        }
      };
      
      mockSocket.simulateMessage(iceMessage);
      
      // Verify handler was called with correct data
      expect(iceCandidateHandler).toHaveBeenCalledWith({
        from: 'remote-peer-id',
        candidate: { candidate: 'test-candidate' }
      });
    });
    
    test('should handle offer messages', async () => {
      // Create handler
      const offerHandler = jest.fn();
      adapter.onOffer(offerHandler);
      
      // Simulate receiving offer message
      const offerMessage = {
        type: 'offer',
        sender: 'remote-peer-id',
        payload: {
          from: 'remote-peer-id',
          offer: {
            sdp: 'test-sdp-offer',
            type: 'offer'
          }
        }
      };
      
      mockSocket.simulateMessage(offerMessage);
      
      // Verify handler was called with correct data
      expect(offerHandler).toHaveBeenCalledWith({
        from: 'remote-peer-id',
        offer: { 
          sdp: 'test-sdp-offer', 
          type: 'offer' 
        }
      });
    });
    
    test('should handle answer messages', async () => {
      // Create handler
      const answerHandler = jest.fn();
      adapter.onAnswer(answerHandler);
      
      // Simulate receiving answer message
      const answerMessage = {
        type: 'answer',
        sender: 'remote-peer-id',
        payload: {
          from: 'remote-peer-id',
          answer: {
            sdp: 'test-sdp-answer',
            type: 'answer'
          }
        }
      };
      
      mockSocket.simulateMessage(answerMessage);
      
      // Verify handler was called with correct data
      expect(answerHandler).toHaveBeenCalledWith({
        from: 'remote-peer-id',
        answer: { 
          sdp: 'test-sdp-answer', 
          type: 'answer' 
        }
      });
    });
    
    test('should handle player-joined messages', async () => {
      // Create handler
      const playerJoinedHandler = jest.fn();
      adapter.onPlayerJoined(playerJoinedHandler);
      
      // Simulate receiving player-joined message
      const playerJoinedMessage = {
        type: 'player-joined',
        payload: {
          peerId: 'joined-peer-id',
          roomId: 'test-room',
          username: 'TestUser',
          totalPlayers: 2,
          isRoomOwner: false
        }
      };
      
      mockSocket.simulateMessage(playerJoinedMessage);
      
      // Verify handler was called with correct data
      expect(playerJoinedHandler).toHaveBeenCalledWith({
        peerId: 'joined-peer-id',
        roomId: 'test-room',
        username: 'TestUser',
        totalPlayers: 2,
        isRoomOwner: false
      });
    });
    
    test('should handle player-left messages', async () => {
      // Create handler
      const playerLeftHandler = jest.fn();
      adapter.onPlayerLeft(playerLeftHandler);
      
      // Simulate receiving player-left message
      const playerLeftMessage = {
        type: 'player-left',
        payload: {
          peerId: 'left-peer-id',
          roomId: 'test-room'
        }
      };
      
      mockSocket.simulateMessage(playerLeftMessage);
      
      // Verify handler was called with correct data
      expect(playerLeftHandler).toHaveBeenCalledWith({
        peerId: 'left-peer-id',
        roomId: 'test-room'
      });
    });
  });
  
  describe('send methods', () => {
    beforeEach(async () => {
      // First connect
      const roomId = 'test-room-123';
      const peerId = 'test-peer-456';
      const connectPromise = adapter.connect(roomId, peerId);
      
      // Get the created WebSocket instance
      // @ts-expect-error - Accessing private socket property
      mockSocket = adapter['socket'] as MockWebSocket;
      
      // Ensure the send method is properly mocked
      mockSocket.send.mockImplementation((_message) => {
        // Handle any message send operation
        return Promise.resolve();
      });
      
      mockSocket.simulateOpen();
      
      // Wait for connection to complete
      await connectPromise;
      
      // Clear initial connection message records
      mockSocket.send.mockClear();
    });
    
    test('should send ice candidate', async () => {
      // Prepare parameters
      const recipientId = 'recipient-peer-id';
      const candidate = { candidate: 'test-ice-candidate', sdpMid: 'data', sdpMLineIndex: 0 };
      
      // Send ice candidate
      await adapter.sendIceCandidate(recipientId, candidate);
      
      // Verify correct data was sent
      expect(mockSocket.send).toHaveBeenCalled();
      
      // Get sent data
      const sentData = mockSocket.send.mock.calls[0][0];
      const parsedData = JSON.parse(sentData);
      
      // Verify sent data contains correct fields
      expect(parsedData.type).toBe('ice-candidate');
      expect(parsedData.payload.recipient).toBe(recipientId);
      expect(parsedData.payload.candidate).toEqual(candidate);
    });
    
    test('should send offer', async () => {
      // Prepare parameters
      const recipientId = 'recipient-peer-id';
      const offer: RTCSessionDescriptionInit = { type: 'offer' as RTCSdpType, sdp: 'test-sdp-offer' };
      
      // Send offer
      await adapter.sendOffer(recipientId, offer);
      
      // Verify correct data was sent
      expect(mockSocket.send).toHaveBeenCalled();
      
      // Get sent data
      const sentData = mockSocket.send.mock.calls[0][0];
      const parsedData = JSON.parse(sentData);
      
      // Verify sent data contains correct fields
      expect(parsedData.type).toBe('offer');
      expect(parsedData.payload.recipient).toBe(recipientId);
      expect(parsedData.payload.offer).toEqual(offer);
    });
    
    test('should send answer', async () => {
      // Prepare parameters
      const recipientId = 'recipient-peer-id';
      const answer: RTCSessionDescriptionInit = { type: 'answer' as RTCSdpType, sdp: 'test-sdp-answer' };
      
      // Send answer
      await adapter.sendAnswer(recipientId, answer);
      
      // Verify correct data was sent
      expect(mockSocket.send).toHaveBeenCalled();
      
      // Get sent data
      const sentData = mockSocket.send.mock.calls[0][0];
      const parsedData = JSON.parse(sentData);
      
      // Verify sent data contains correct fields
      expect(parsedData.type).toBe('answer');
      expect(parsedData.payload.recipient).toBe(recipientId);
      expect(parsedData.payload.answer).toEqual(answer);
    });
    
    test('should update connection state', async () => {
      // Prepare parameters
      const peerId = 'peer-id';
      const state = 'connected';
      
      // Update connection state
      await adapter.updateConnectionState(peerId, state);
      
      // Verify correct data was sent
      expect(mockSocket.send).toHaveBeenCalled();
      
      // Get sent data
      const sentData = mockSocket.send.mock.calls[0][0];
      const parsedData = JSON.parse(sentData);
      
      // Verify sent data contains correct fields
      expect(parsedData.type).toBe('connection-state');
      expect(parsedData.payload.peerId).toBe(peerId);
      expect(parsedData.payload.state).toBe(state);
    });
  });
}); 