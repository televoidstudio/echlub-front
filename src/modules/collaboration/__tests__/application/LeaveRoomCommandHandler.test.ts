import 'reflect-metadata';
import { LeaveRoomCommandHandler } from '../../application/handlers/LeaveRoomCommandHandler';
import { LeaveRoomCommand } from '../../application/commands/LeaveRoomCommand';
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

describe('LeaveRoomCommandHandler', () => {
  let roomRepository: IRoomRepository;
  let eventBus: MockEventBus;
  let commandHandler: LeaveRoomCommandHandler;
  
  // Test room data
  const roomId = RoomId.create();
  const ownerId = PeerId.create();
  const ownerUsername = 'RoomOwner';
  const roomName = 'Test Room';
  const rules = RoomRuleVO.create(4, true, 100, 32000);
  
  beforeEach(async () => {
    roomRepository = new InMemoryRoomRepository();
    eventBus = new MockEventBus();
    commandHandler = new LeaveRoomCommandHandler(roomRepository, eventBus);
    
    // Create test room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    await roomRepository.save(room);
    
    // Clear events generated during room creation
    room.clearDomainEvents();
  });
  
  test('should allow a regular player to leave a room', async () => {
    // Add a second player to the room
    const peerId = PeerId.create();
    const username = 'TestPlayer';
    const room = await roomRepository.findById(roomId);
    expect(room).not.toBeNull();
    
    if (room) {
      room.joinPlayer(peerId, username);
      await roomRepository.save(room);
      room.clearDomainEvents();
      
      // Verify player has joined
      expect(room.playerCount).toBe(2);
      
      // Create leave command
      const command = new LeaveRoomCommand(roomId, peerId);
      
      // Handle command
      await commandHandler.handle(command);
      
      // Verify player has left
      const updatedRoom = await roomRepository.findById(roomId);
      expect(updatedRoom).not.toBeNull();
      expect(updatedRoom?.playerCount).toBe(1);
      expect(updatedRoom?.getPlayer(peerId)).toBeUndefined();
      
      // Verify event was published
      expect(eventBus.publishedEvents.length).toBe(1);
      expect(eventBus.publishedEvents[0].eventType).toBe('collab.player-left');
    }
  });
  
  test('should throw an error when room does not exist', async () => {
    // Create test data
    const nonExistentRoomId = RoomId.create();
    const peerId = PeerId.create();
    
    // Create command
    const command = new LeaveRoomCommand(nonExistentRoomId, peerId);
    
    // Expect error when handling command
    await expect(commandHandler.handle(command)).rejects.toThrow(/Room not found/);
  });
  
  test('should close the room when the owner leaves', async () => {
    // Create leave command for the owner
    const command = new LeaveRoomCommand(roomId, ownerId);
    
    // Handle command
    await commandHandler.handle(command);
    
    // Verify room was deleted/closed
    const room = await roomRepository.findById(roomId);
    expect(room).toBeNull();
    
    // Verify events were published (player-left and room-closed)
    expect(eventBus.publishedEvents.length).toBe(2);
    expect(eventBus.publishedEvents[0].eventType).toBe('collab.player-left');
    expect(eventBus.publishedEvents[1].eventType).toBe('collab.room-closed');
  });
  
  test('should handle a player that is not in the room', async () => {
    // Create leave command for a player not in the room
    const nonMemberPeerId = PeerId.create();
    const command = new LeaveRoomCommand(roomId, nonMemberPeerId);
    
    // Handle command should not throw error
    // The domain model should handle this case
    await expect(commandHandler.handle(command)).rejects.toThrow(/Player not in room/);
  });
}); 