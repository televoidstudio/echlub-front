import 'reflect-metadata';
import { CloseRoomCommandHandler } from '../../application/handlers/CloseRoomCommandHandler';
import { CloseRoomCommand } from '../../application/commands/CloseRoomCommand';
import { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { InMemoryRoomRepository } from '../../infrastructure/repositories/InMemoryRoomRepository';
import { IEventBus } from '../../../../core/event-bus/IEventBus';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import { Room } from '../../domain/aggregates/Room';
import { RoomRuleVO } from '../../domain/value-objects/RoomRuleVO';
import { UniqueId } from '../../../../shared/domain/value-objects/UniqueId';
import { v4 as uuidv4 } from 'uuid';

// Initialize the UUID generator for tests
UniqueId.initialize();
// Directly set generators for the ID classes
RoomId.setGenerator(() => uuidv4());
PeerId.setGenerator(() => uuidv4());

// Mock event bus
class MockEventBus implements IEventBus {
  public publishedEvents: any[] = [];
  
  async publish(event: any): Promise<void> {
    this.publishedEvents.push(event);
  }
  
  async emit(eventName: string, payload: any): Promise<void> {
    this.publishedEvents.push({ eventName, payload });
  }
  
  on(_eventName: string, _handler: (payload: any) => void): void {
    // Not needed for tests
  }
  
  off(_eventName: string, _handler: (payload: any) => void): void {
    // Not needed for tests
  }
  
  once(_eventName: string, _handler: (payload: any) => void): void {
    // Not needed for tests
  }
  
  async subscribe(_eventName: string, _callback: (payload: any) => Promise<void>): Promise<void> {
    // Not needed for tests
  }
  
  async unsubscribe(_eventName: string): Promise<void> {
    // Not needed for tests
  }
}

describe('CloseRoomCommandHandler', () => {
  let roomRepository: IRoomRepository;
  let eventBus: MockEventBus;
  let commandHandler: CloseRoomCommandHandler;
  
  // Test room data
  const roomId = RoomId.create();
  const ownerId = PeerId.create();
  const ownerUsername = 'RoomOwner';
  const roomName = 'Test Room';
  const rules = RoomRuleVO.create(4, true, 100, 32000);
  
  beforeEach(async () => {
    roomRepository = new InMemoryRoomRepository();
    eventBus = new MockEventBus();
    commandHandler = new CloseRoomCommandHandler(roomRepository, eventBus);
    
    // Create test room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    await roomRepository.save(room);
    
    // Clear events generated during room creation
    room.clearDomainEvents();
  });
  
  test('should close a room when the owner requests it', async () => {
    // Create close command
    const command = new CloseRoomCommand(roomId, ownerId);
    
    // Handle command
    await commandHandler.handle(command);
    
    // Verify room was deleted/closed
    const room = await roomRepository.findById(roomId);
    expect(room).toBeNull();
    
    // Verify event was published
    expect(eventBus.publishedEvents.length).toBe(1);
    expect(eventBus.publishedEvents[0].eventType).toBe('collab.room-closed');
  });
  
  test('should throw an error when room does not exist', async () => {
    // Create test data with non-existent room
    const nonExistentRoomId = RoomId.create();
    
    // Create command
    const command = new CloseRoomCommand(nonExistentRoomId, ownerId);
    
    // Expect error when handling command
    await expect(commandHandler.handle(command)).rejects.toThrow(/Room not found/);
  });
  
  test('should throw an error when non-owner tries to close the room', async () => {
    // Create test data with different user ID
    const nonOwnerPeerId = PeerId.create();
    
    // Create command with non-owner ID
    const command = new CloseRoomCommand(roomId, nonOwnerPeerId);
    
    // Expect error when handling command
    await expect(commandHandler.handle(command)).rejects.toThrow(/Only the room owner can close the room/);
  });
  
  test('should close a room with multiple players', async () => {
    // Add a few players to the room
    const room = await roomRepository.findById(roomId);
    expect(room).not.toBeNull();
    
    if (room) {
      // Add two more players
      const player1Id = PeerId.create();
      const player2Id = PeerId.create();
      
      room.joinPlayer(player1Id, 'Player1');
      room.joinPlayer(player2Id, 'Player2');
      await roomRepository.save(room);
      room.clearDomainEvents();
      
      // Verify players have joined
      expect(room.playerCount).toBe(3);
      
      // Create close command
      const command = new CloseRoomCommand(roomId, ownerId);
      
      // Handle command
      await commandHandler.handle(command);
      
      // Verify room was deleted/closed
      const updatedRoom = await roomRepository.findById(roomId);
      expect(updatedRoom).toBeNull();
      
      // Verify event was published
      expect(eventBus.publishedEvents.length).toBe(1);
      expect(eventBus.publishedEvents[0].eventType).toBe('collab.room-closed');
    }
  });
}); 