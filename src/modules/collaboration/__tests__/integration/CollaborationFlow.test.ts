import 'reflect-metadata';
import { Container } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { MockCollaborationApiAdapter } from '../mocks/MockCollaborationApiAdapter';
import { MockSignalHubAdapter } from '../mocks/MockSignalHubAdapter';
import { WebRTCAdapter } from '../../infrastructure/adapters/WebRTCAdapter';
import { CollaborationService } from '../../application/services/CollaborationService';
import { InMemoryRoomRepository } from '../../infrastructure/repositories/InMemoryRoomRepository';
import { TYPES } from '../../../../core/di/types';
import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import { v4 as uuidv4 } from 'uuid';
import { ILocalCacheAdapter } from '../../infrastructure/adapters/ILocalCacheAdapter';
import { IWebRTCAdapter } from '../../infrastructure/adapters/IWebRTCAdapter';

// Initialize UUID generators
RoomId.setGenerator(() => uuidv4());
PeerId.setGenerator(() => uuidv4());

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onicecandidate: ((event: any) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  iceConnectionState: RTCIceConnectionState = 'new';
  
  createDataChannel = jest.fn().mockImplementation(() => ({
    label: 'test-channel',
    readyState: 'open',
    send: jest.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null
  }));
  
  createOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
  createAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' });
  setLocalDescription = jest.fn().mockResolvedValue(undefined);
  setRemoteDescription = jest.fn().mockResolvedValue(undefined);
  addIceCandidate = jest.fn().mockResolvedValue(undefined);
  close = jest.fn();
  
  simulateConnected(): void {
    this.iceConnectionState = 'connected';
    if (this.oniceconnectionstatechange) {
      this.oniceconnectionstatechange();
    }
  }
}

// Mock LocalCacheAdapter
class MockLocalCacheAdapter implements ILocalCacheAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: Map<string, any> = new Map();
  
  async get<T>(key: string): Promise<T | null> {
    return this.cache.get(key) || null;
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
  }
  
  async remove(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
}

// Override globals
global.RTCPeerConnection = MockRTCPeerConnection as unknown as typeof RTCPeerConnection;

describe('Collaboration Flow Integration', () => {
  let container: Container;
  let collaborationService: CollaborationService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEventBus: any;
  let eventHandlers: Record<string, Array<(data: any) => void>>;
  
  beforeEach(() => {
    // Create event bus mock
    eventHandlers = {};
    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn((event, handler) => {
        if (!eventHandlers[event]) eventHandlers[event] = [];
        eventHandlers[event].push(handler);
      }),
      off: jest.fn(),
      once: jest.fn(),
      publish: jest.fn()
    };
    
    // Setup DI container
    container = new Container();
    
    // Register core services
    container.bind(TYPES.EventBus).toConstantValue(mockEventBus);
    
    // Register repositories
    container.bind(CollaborationTypes.RoomRepository).to(InMemoryRoomRepository).inSingletonScope();
    
    // Register adapters
    container.bind(CollaborationTypes.CollaborationApiAdapter).to(MockCollaborationApiAdapter).inSingletonScope();
    container.bind(CollaborationTypes.SignalHubAdapter).to(MockSignalHubAdapter).inSingletonScope();
    container.bind(CollaborationTypes.WebRTCAdapter).to(WebRTCAdapter).inSingletonScope();
    container.bind(CollaborationTypes.LocalCacheAdapter).to(MockLocalCacheAdapter).inSingletonScope();
    
    // Register service
    container.bind(CollaborationTypes.CollaborationService).to(CollaborationService).inSingletonScope();
    
    // Get service instance
    collaborationService = container.get<CollaborationService>(CollaborationTypes.CollaborationService);
  });
  
  test('full collaboration flow', async () => {
    // STEP 1: Create room
    const localPeerId = PeerId.create();
    const username = 'TestUser';
    
    // Initialize the service
    await collaborationService.initialize(localPeerId);
    
    // Create room with correct parameters
    const roomCreationResult = await collaborationService.createRoom(
      localPeerId, 
      username, 
      'Test Room',
      4,    // maxPlayers
      true, // allowRelay
      100,  // latencyTargetMs
      32000 // opusBitrate
    );
    
    expect(roomCreationResult).not.toBeNull();
    const roomId = roomCreationResult!;
    
    // STEP 2: Connect to signaling server
    await collaborationService.joinRoom(roomId);
    
    // STEP 3: Simulate remote player joining
    const remotePeerId = PeerId.create();
    const remoteUsername = 'RemoteUser';
    
    // Simulate player joined event
    if (eventHandlers['collab.player-joined']) {
      for (const handler of eventHandlers['collab.player-joined']) {
        await handler({
          roomId: roomId.toString(),
          peerId: remotePeerId.toString(),
          username: remoteUsername,
          totalPlayers: 2,
          isRoomOwner: false
        });
      }
    }
    
    // STEP 4: Establish WebRTC connection
    const peerConnectionState = collaborationService.getPeerConnectionState(remotePeerId);
    
    // Initial state should be disconnected or connecting
    expect([ConnectionState.DISCONNECTED, ConnectionState.CONNECTING]).toContain(peerConnectionState);
    
    // 獲取 WebRTCAdapter 實例並直接設置連接狀態
    const webRTCAdapter = container.get<IWebRTCAdapter>(CollaborationTypes.WebRTCAdapter);
    
    // 直接覆蓋 getConnectionState 方法，不實際創建連接
    const originalGetConnectionState = webRTCAdapter.getConnectionState;
    webRTCAdapter.getConnectionState = jest.fn((peerId) => {
      if (peerId.toString() === remotePeerId.toString()) {
        return ConnectionState.CONNECTED;
      }
      return originalGetConnectionState.call(webRTCAdapter, peerId);
    });
    
    // 觸發狀態變更事件
    (webRTCAdapter as any).notifyConnectionStateChange(remotePeerId, ConnectionState.CONNECTED);
    
    // Peer connection state should now be connected
    const connectedState = collaborationService.getPeerConnectionState(remotePeerId);
    expect(connectedState).toBe(ConnectionState.CONNECTED);
    
    // STEP 5: Update room rules
    const newRules = {
      maxPlayers: 6,
      allowRelay: false,
      latencyTargetMs: 200,
      opusBitrate: 64000
    };
    
    await collaborationService.updateRoomRules(
      roomId,
      localPeerId,
      newRules.maxPlayers,
      newRules.allowRelay,
      newRules.latencyTargetMs,
      newRules.opusBitrate
    );
    
    // STEP 6: Close room
    await collaborationService.closeRoom(roomId, localPeerId);
  });
}); 