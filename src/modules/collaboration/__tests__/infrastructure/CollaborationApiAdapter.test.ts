import 'reflect-metadata';
import { MockCollaborationApiAdapter } from '../mocks/MockCollaborationApiAdapter';
import { RoomId } from '../../domain/value-objects/RoomId';
import { v4 as uuidv4 } from 'uuid';
import { ICollaborationApiAdapter } from '../../infrastructure/adapters/ICollaborationApiAdapter';

// Initialize UUID generators
RoomId.setGenerator(() => uuidv4());

// Mock fetch API
global.fetch = jest.fn();

describe('CollaborationApiAdapter', () => {
  let adapter: ICollaborationApiAdapter;
  let mockFetch: jest.Mock;
  
  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock;
    mockFetch.mockClear();
    
    // Create adapter instance
    adapter = new MockCollaborationApiAdapter();
  });
  
  describe('createRoom', () => {
    test('should return successful response', async () => {
      // Request data
      const request = {
        ownerId: 'owner-id',
        maxPlayers: 4,
        allowRelay: true,
        latencyTargetMs: 100,
        opusBitrate: 32000
      };
      
      // Call method
      const result = await adapter.createRoom(request);
      
      // Verify result
      expect(result.data).toBeDefined();
      expect(result.data?.roomId).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });
  
  describe('getRoom', () => {
    test('should return room data', async () => {
      // Create room ID
      const roomId = RoomId.create();
      
      // Call method
      const result = await adapter.getRoom(roomId);
      
      // Verify result
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });
  
  describe('updateRoomRules', () => {
    test('should update room rules successfully', async () => {
      // Create room ID
      const roomId = RoomId.create();
      
      // Request data
      const request = {
        ownerId: 'owner-id',
        maxPlayers: 6,
        allowRelay: false,
        latencyTargetMs: 200,
        opusBitrate: 64000
      };
      
      // Call method
      const result = await adapter.updateRoomRules(roomId, request);
      
      // Verify result
      expect(result.message).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });
  
  describe('closeRoom', () => {
    test('should close room successfully', async () => {
      // Create room ID
      const roomId = RoomId.create();
      
      // Request data
      const request = {
        ownerId: 'owner-id'
      };
      
      // Call method
      const result = await adapter.closeRoom(roomId, request);
      
      // Verify result
      expect(result.message).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });
}); 