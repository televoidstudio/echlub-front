import 'reflect-metadata';
import { WebRTCAdapter } from '../../infrastructure/adapters/WebRTCAdapter';
import { ISignalHubAdapter } from '../../infrastructure/adapters/ISignalHubAdapter';
import { PeerId } from '../../domain/value-objects/PeerId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import { SignalType } from '../../infrastructure/adapters/IWebRTCAdapter';
import { v4 as uuidv4 } from 'uuid';

// Initialize UUID generators
PeerId.setGenerator(() => uuidv4());

// 創建模擬數據通道
const createMockDataChannel = () => ({
  label: 'test-channel',
  readyState: 'open',
  send: jest.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null
});

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  onicecandidate: ((event: any) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  iceConnectionState: RTCIceConnectionState = 'new';
  
  // 保存創建的數據通道以便測試訪問
  dataChannel = createMockDataChannel();
  
  // Method mocks
  createDataChannel = jest.fn().mockImplementation(() => this.dataChannel);
  
  createOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
  createAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' });
  setLocalDescription = jest.fn().mockResolvedValue(undefined);
  setRemoteDescription = jest.fn().mockResolvedValue(undefined);
  addIceCandidate = jest.fn().mockResolvedValue(undefined);
  close = jest.fn();
  
  // Helper to simulate ice candidate event
  simulateIceCandidate(candidate: any): void {
    if (this.onicecandidate) {
      this.onicecandidate({ candidate });
    }
  }
  
  // Helper to simulate ice connection state change
  simulateIceConnectionStateChange(newState: RTCIceConnectionState): void {
    this.iceConnectionState = newState;
    if (this.oniceconnectionstatechange) {
      this.oniceconnectionstatechange();
    }
  }
}

// 自定義RTCIceCandidate類型，擴展原生的RTCIceCandidateInit並添加toJSON方法
// @ts-expect-error - 此介面暫未使用，但可能在將來的測試中有用
interface _MockRTCIceCandidate extends RTCIceCandidateInit {
  toJSON(): any;
}

describe('WebRTCAdapter', () => {
  let adapter: WebRTCAdapter;
  let mockSignalHub: Partial<ISignalHubAdapter>;
  let localPeerId: PeerId;
  let mockPeerConnection: MockRTCPeerConnection;
  let originalRTCPeerConnection: any;
  
  beforeAll(() => {
    // 保存原始的RTCPeerConnection
    originalRTCPeerConnection = global.RTCPeerConnection;
  });

  afterAll(() => {
    // 恢復原始的RTCPeerConnection
    global.RTCPeerConnection = originalRTCPeerConnection;
  });
  
  beforeEach(() => {
    // 每次測試前創建一個新的模擬實例
    mockPeerConnection = new MockRTCPeerConnection();
    
    // 使用jest.fn替代全局RTCPeerConnection構造函數
    global.RTCPeerConnection = jest.fn(() => mockPeerConnection) as any;
    
    // Setup mock signal hub
    mockSignalHub = {
      sendIceCandidate: jest.fn().mockResolvedValue(undefined),
      sendOffer: jest.fn().mockResolvedValue(undefined),
      sendAnswer: jest.fn().mockResolvedValue(undefined),
      updateConnectionState: jest.fn().mockResolvedValue(undefined),
      onIceCandidate: jest.fn(),
      onOffer: jest.fn(),
      onAnswer: jest.fn(),
      onReconnectNeeded: jest.fn(),
      onPeerConnectionState: jest.fn(),
      onWebRTCFallbackNeeded: jest.fn(),
      activateWebRTCFallback: jest.fn().mockResolvedValue(undefined),
      relayData: jest.fn().mockResolvedValue(undefined),
      requestReconnect: jest.fn().mockResolvedValue(undefined)
    };
    
    // Create adapter instance
    adapter = new WebRTCAdapter(mockSignalHub as ISignalHubAdapter);
    
    // Initialize with local peer ID
    localPeerId = PeerId.create();
  });
  
  describe('initialize', () => {
    test('should initialize adapter and subscribe to events', async () => {
      // Initialize adapter
      await adapter.initialize(localPeerId);
      
      // Verify event subscriptions
      expect(mockSignalHub.onIceCandidate).toHaveBeenCalled();
      expect(mockSignalHub.onOffer).toHaveBeenCalled();
      expect(mockSignalHub.onAnswer).toHaveBeenCalled();
      expect(mockSignalHub.onReconnectNeeded).toHaveBeenCalled();
      expect(mockSignalHub.onPeerConnectionState).toHaveBeenCalled();
      expect(mockSignalHub.onWebRTCFallbackNeeded).toHaveBeenCalled();
    });
  });
  
  describe('createConnection', () => {
    beforeEach(async () => {
      // Initialize adapter first
      await adapter.initialize(localPeerId);
    });
    
    test('should create a new peer connection as initiator', async () => {
      // Setup
      const remotePeerId = PeerId.create();
      
      // Create connection
      await adapter.createConnection(remotePeerId, true);
      
      // Verify RTCPeerConnection was created
      expect(global.RTCPeerConnection).toHaveBeenCalled();
      
      // Verify call to create offer and send it
      expect(mockPeerConnection.createOffer).toHaveBeenCalled();
      expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
      expect(mockSignalHub.sendOffer).toHaveBeenCalledWith(
        remotePeerId.toString(),
        expect.objectContaining({ type: 'offer', sdp: 'mock-sdp' })
      );
      
      // Test connection state
      expect(adapter.getConnectionState(remotePeerId)).toBe(ConnectionState.DISCONNECTED);
      
      // Simulate ice connection state change
      mockPeerConnection.simulateIceConnectionStateChange('checking');
      expect(adapter.getConnectionState(remotePeerId)).toBe(ConnectionState.CONNECTING);
      
      mockPeerConnection.simulateIceConnectionStateChange('connected');
      expect(adapter.getConnectionState(remotePeerId)).toBe(ConnectionState.CONNECTED);
      
      // Verify server was notified of state change
      expect(mockSignalHub.updateConnectionState).toHaveBeenCalledWith(
        remotePeerId.toString(), 
        ConnectionState.CONNECTED.toString()
      );
    });
    
    test('should handle ice candidate events', async () => {
      // Setup
      const remotePeerId = PeerId.create();
      
      // Create connection
      await adapter.createConnection(remotePeerId, false);
      
      // Simulate ice candidate event
      const mockCandidate = { candidate: 'mock-candidate' };
      // 創建一個帶有toJSON方法的模擬對象
      const mockIceCandidate = {
        candidate: 'mock-candidate',
        toJSON: () => mockCandidate
      };
      
      mockPeerConnection.simulateIceCandidate(mockIceCandidate);
      
      // Verify candidate was sent
      expect(mockSignalHub.sendIceCandidate).toHaveBeenCalledWith(
        remotePeerId.toString(),
        mockCandidate
      );
    });
  });
  
  describe('processSignal', () => {
    beforeEach(async () => {
      // Initialize adapter first
      await adapter.initialize(localPeerId);
    });
    
    test('should process an offer signal and create answer', async () => {
      // Setup
      const remotePeerId = PeerId.create();
      const offerSignal = {
        type: SignalType.OFFER,
        sender: remotePeerId.toString(),
        recipient: localPeerId.toString(),
        payload: { sdp: { type: 'offer', sdp: 'mock-offer-sdp' } }
      };
      
      // Process offer signal
      await adapter.processSignal(offerSignal);
      
      // Verify RTCPeerConnection was created
      expect(global.RTCPeerConnection).toHaveBeenCalled();
      
      // Verify call to create answer
      expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith(offerSignal.payload.sdp);
      expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
      expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
      expect(mockSignalHub.sendAnswer).toHaveBeenCalledWith(
        remotePeerId.toString(),
        expect.objectContaining({ type: 'answer', sdp: 'mock-sdp' })
      );
    });
    
    test('should process an answer signal', async () => {
      // Setup - create a connection first
      const remotePeerId = PeerId.create();
      await adapter.createConnection(remotePeerId, true);
      
      // Reset mocks
      mockPeerConnection.setRemoteDescription.mockClear();
      
      // Create answer signal
      const answerSignal = {
        type: SignalType.ANSWER,
        sender: remotePeerId.toString(),
        recipient: localPeerId.toString(),
        payload: { sdp: { type: 'answer', sdp: 'mock-answer-sdp' } }
      };
      
      // Process answer signal
      await adapter.processSignal(answerSignal);
      
      // Verify remote description was set
      expect(mockPeerConnection.setRemoteDescription)
        .toHaveBeenCalledWith(answerSignal.payload.sdp);
    });
    
    test('should process an ice candidate signal', async () => {
      // Setup - create a connection first
      const remotePeerId = PeerId.create();
      await adapter.createConnection(remotePeerId, true);
      
      // Reset mocks
      mockPeerConnection.addIceCandidate.mockClear();
      
      // Create ice candidate signal
      const candidateSignal = {
        type: SignalType.ICE_CANDIDATE,
        sender: remotePeerId.toString(),
        recipient: localPeerId.toString(),
        payload: { candidate: { candidate: 'mock-ice-candidate' } }
      };
      
      // Process ice candidate signal
      await adapter.processSignal(candidateSignal);
      
      // Verify ice candidate was added
      expect(mockPeerConnection.addIceCandidate)
        .toHaveBeenCalledWith(candidateSignal.payload.candidate);
    });
  });
  
  describe('sendData', () => {
    beforeEach(async () => {
      // Initialize adapter first
      await adapter.initialize(localPeerId);
    });
    
    test('should send data through data channel', async () => {
      // Setup - create a connection first
      const remotePeerId = PeerId.create();
      
      // 在PeerConnection中模擬sendData方法
      const mockPeerInstance = {
        sendData: jest.fn().mockResolvedValue(undefined),
        getConnectionState: () => ConnectionState.CONNECTED
      };
      
      // 將適配器內部的connections Map設置為使用我們的模擬實例
      Object.defineProperty(adapter, 'connections', {
        value: new Map().set(remotePeerId.toString(), mockPeerInstance)
      });
      
      // Send data
      const channelName = 'test-channel';
      const data = { message: 'hello' };
      await adapter.sendData(remotePeerId, channelName, data);
      
      // Verify data was sent
      expect(mockPeerInstance.sendData).toHaveBeenCalledWith(channelName, data);
    });
    
    test('should fall back to relay when data channel fails', async () => {
      // Setup - create a connection first
      const remotePeerId = PeerId.create();
      
      // 在PeerConnection中模擬sendData方法拋出錯誤
      const mockPeerInstance = {
        sendData: jest.fn().mockImplementation(() => {
          throw new Error('Channel failed');
        }),
        getConnectionState: () => ConnectionState.CONNECTED
      };
      
      // 將適配器內部的connections Map設置為使用我們的模擬實例
      Object.defineProperty(adapter, 'connections', {
        value: new Map().set(remotePeerId.toString(), mockPeerInstance)
      });
      
      // Send data
      const channelName = 'test-channel';
      const data = { message: 'hello' };
      await adapter.sendData(remotePeerId, channelName, data);
      
      // Verify fallback was activated
      expect(mockSignalHub.activateWebRTCFallback).toHaveBeenCalledWith(remotePeerId.toString());
      expect(mockSignalHub.relayData).toHaveBeenCalledWith(
        remotePeerId.toString(),
        expect.objectContaining({
          channel: channelName,
          data: data
        })
      );
    });
    
    test('should use relay for connections in fallback state', async () => {
      // Setup - create a connection with fallback state
      const remotePeerId = PeerId.create();
      
      // Manually set up the connection state as FALLBACK
      Object.defineProperty(adapter, 'connections', {
        value: new Map().set(remotePeerId.toString(), {
          getConnectionState: () => ConnectionState.FALLBACK
        })
      });
      
      // Send data
      const channelName = 'test-channel';
      const data = { message: 'hello' };
      await adapter.sendData(remotePeerId, channelName, data);
      
      // Verify relay was used
      expect(mockSignalHub.relayData).toHaveBeenCalledWith(
        remotePeerId.toString(),
        expect.objectContaining({
          channel: channelName,
          data: data
        })
      );
    });
  });
  
  describe('closeConnection', () => {
    beforeEach(async () => {
      // Initialize adapter first
      await adapter.initialize(localPeerId);
    });
    
    test('should close peer connection', async () => {
      // Setup - create a connection first
      const remotePeerId = PeerId.create();
      
      // 在PeerConnection中模擬close方法
      const mockPeerInstance = {
        close: jest.fn(),
        getConnectionState: () => ConnectionState.CONNECTED
      };
      
      // 將適配器內部的connections Map設置為使用我們的模擬實例
      Object.defineProperty(adapter, 'connections', {
        value: new Map().set(remotePeerId.toString(), mockPeerInstance)
      });
      
      // Close connection
      await adapter.closeConnection(remotePeerId);
      
      // Verify connection was closed
      expect(mockPeerInstance.close).toHaveBeenCalled();
    });
  });
  
  describe('handleFallbackNeeded', () => {
    beforeEach(async () => {
      // Initialize adapter first
      await adapter.initialize(localPeerId);
    });
    
    test('should set connection state to fallback', async () => {
      // Setup connection state change listener
      const stateChangeListener = jest.fn();
      adapter.onConnectionStateChange(stateChangeListener);
      
      // Setup - create a connection first
      const remotePeerId = PeerId.create();
      await adapter.createConnection(remotePeerId, true);
      
      // Call signalHub handler with mock data
      const handler = (mockSignalHub.onWebRTCFallbackNeeded as jest.Mock).mock.calls[0][0];
      await handler({ peerId: remotePeerId.toString() });
      
      // Verify state was changed to fallback
      expect(stateChangeListener).toHaveBeenCalledWith(remotePeerId, ConnectionState.FALLBACK);
    });
  });
}); 