import 'reflect-metadata';
import { InMemoryRoomRepository } from '../../infrastructure/repositories/InMemoryRoomRepository';
import { Room } from '../../domain/aggregates/Room';
import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomRuleVO } from '../../domain/value-objects/RoomRuleVO';
import { UniqueId } from '../../../../shared/domain/value-objects/UniqueId';
import { v4 as uuidv4 } from 'uuid';

// Initialize the UUID generator for tests
UniqueId.initialize();
// Directly set generators for the ID classes
RoomId.setGenerator(() => uuidv4());
PeerId.setGenerator(() => uuidv4());

describe('InMemoryRoomRepository', () => {
  let repository: InMemoryRoomRepository;
  
  beforeEach(() => {
    repository = new InMemoryRoomRepository();
  });
  
  test('should save and find a room by ID', async () => {
    // Create a test room
    const roomId = RoomId.create();
    const ownerId = PeerId.create();
    const ownerUsername = 'TestOwner';
    const roomName = 'Test Room';
    const rules = RoomRuleVO.create(4, true, 100, 32000);
    
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    
    // Save the room
    await repository.save(room);
    
    // Find the room by ID
    const foundRoom = await repository.findById(roomId);
    
    // Verify the room was found
    expect(foundRoom).not.toBeNull();
    expect(foundRoom?.roomId.equals(roomId)).toBe(true);
    expect(foundRoom?.name).toBe(roomName);
    expect(foundRoom?.ownerId.equals(ownerId)).toBe(true);
  });
  
  test('should return null when finding a non-existent room', async () => {
    const nonExistentRoomId = RoomId.create();
    
    const room = await repository.findById(nonExistentRoomId);
    
    expect(room).toBeNull();
  });
  
  test('should update an existing room', async () => {
    // Create a test room
    const roomId = RoomId.create();
    const ownerId = PeerId.create();
    const ownerUsername = 'TestOwner';
    const roomName = 'Test Room';
    const rules = RoomRuleVO.create(4, true, 100, 32000);
    
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    
    // Save the room
    await repository.save(room);
    
    // Modify the room
    const playerId = PeerId.create();
    const playerUsername = 'TestPlayer';
    room.joinPlayer(playerId, playerUsername);
    
    // Save the updated room
    await repository.save(room);
    
    // Find the room again
    const updatedRoom = await repository.findById(roomId);
    
    // Verify the room was updated
    expect(updatedRoom).not.toBeNull();
    expect(updatedRoom?.playerCount).toBe(2);
    expect(updatedRoom?.getPlayer(playerId)).not.toBeUndefined();
  });
  
  test('should delete a room', async () => {
    // Create a test room
    const roomId = RoomId.create();
    const ownerId = PeerId.create();
    const ownerUsername = 'TestOwner';
    const roomName = 'Test Room';
    const rules = RoomRuleVO.create(4, true, 100, 32000);
    
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    
    // Save the room
    await repository.save(room);
    
    // Delete the room
    await repository.delete(roomId);
    
    // Try to find the deleted room
    const deletedRoom = await repository.findById(roomId);
    
    // Verify the room was deleted
    expect(deletedRoom).toBeNull();
  });
  
  test('should handle deleting a non-existent room without errors', async () => {
    const nonExistentRoomId = RoomId.create();
    
    // Deleting a non-existent room should not throw an error
    await expect(repository.delete(nonExistentRoomId)).resolves.not.toThrow();
  });
}); 