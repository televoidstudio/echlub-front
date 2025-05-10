import 'reflect-metadata';
import { UpdateRoomRulesCommandHandler } from '../../application/handlers/UpdateRoomRulesCommandHandler';
import { UpdateRoomRulesCommand } from '../../application/commands/UpdateRoomRulesCommand';
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

describe('UpdateRoomRulesCommandHandler', () => {
  let roomRepository: IRoomRepository;
  let eventBus: MockEventBus;
  let commandHandler: UpdateRoomRulesCommandHandler;
  
  // Test room data
  const roomId = RoomId.create();
  const ownerId = PeerId.create();
  const ownerUsername = 'RoomOwner';
  const roomName = 'Test Room';
  const rules = RoomRuleVO.create(4, true, 100, 32000);
  
  beforeEach(async () => {
    roomRepository = new InMemoryRoomRepository();
    eventBus = new MockEventBus();
    commandHandler = new UpdateRoomRulesCommandHandler(roomRepository, eventBus);
    
    // Create test room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    await roomRepository.save(room);
    
    // Clear events generated during room creation
    room.clearDomainEvents();
  });
  
  test('should update room rules when owner requests it', async () => {
    // Create update command with new values
    const command = new UpdateRoomRulesCommand(
      roomId,
      ownerId,
      8, // new maxPlayers
      false, // new allowRelay
      50, // new latencyTargetMs
      16000 // new opusBitrate
    );
    
    // Handle command
    await commandHandler.handle(command);
    
    // Verify room rules were updated
    const room = await roomRepository.findById(roomId);
    expect(room).not.toBeNull();
    
    if (room) {
      expect(room.rules.maxPlayers).toBe(8);
      expect(room.rules.allowRelay).toBe(false);
      expect(room.rules.latencyTargetMs).toBe(50);
      expect(room.rules.opusBitrate).toBe(16000);
    }
    
    // Verify event was published
    expect(eventBus.publishedEvents.length).toBe(1);
    expect(eventBus.publishedEvents[0].eventType).toBe('collab.room-rule-changed');
  });
  
  test('should only update provided rules, keeping others unchanged', async () => {
    // Create update command with only some values
    const command = new UpdateRoomRulesCommand(
      roomId,
      ownerId,
      6, // new maxPlayers
      undefined, // keep current allowRelay
      80, // new latencyTargetMs
      undefined // keep current opusBitrate
    );
    
    // Handle command
    await commandHandler.handle(command);
    
    // Verify only specified rules were updated
    const room = await roomRepository.findById(roomId);
    expect(room).not.toBeNull();
    
    if (room) {
      expect(room.rules.maxPlayers).toBe(6); // Updated
      expect(room.rules.allowRelay).toBe(true); // Unchanged
      expect(room.rules.latencyTargetMs).toBe(80); // Updated
      expect(room.rules.opusBitrate).toBe(32000); // Unchanged
    }
    
    // Verify event was published
    expect(eventBus.publishedEvents.length).toBe(1);
    expect(eventBus.publishedEvents[0].eventType).toBe('collab.room-rule-changed');
  });
  
  test('should throw an error when room does not exist', async () => {
    // Create test data with non-existent room
    const nonExistentRoomId = RoomId.create();
    
    // Create command
    const command = new UpdateRoomRulesCommand(
      nonExistentRoomId,
      ownerId,
      6
    );
    
    // Expect error when handling command
    await expect(commandHandler.handle(command)).rejects.toThrow(/Room not found/);
  });
  
  test('should throw an error when non-owner tries to update rules', async () => {
    // Create test data with different user ID
    const nonOwnerPeerId = PeerId.create();
    
    // Create command with non-owner ID
    const command = new UpdateRoomRulesCommand(
      roomId,
      nonOwnerPeerId,
      6
    );
    
    // Expect error when handling command
    await expect(commandHandler.handle(command)).rejects.toThrow(/Only the room owner can update room rules/);
  });
  
  test('should handle valid rule values at limits', async () => {
    // Create room with specific rules
    const customRoomId = RoomId.create();
    const customRoom = Room.create(
      customRoomId,
      ownerId,
      ownerUsername,
      'Custom Rules Room',
      RoomRuleVO.create(4, true, 100, 32000)
    );
    await roomRepository.save(customRoom);
    customRoom.clearDomainEvents();
    
    // Create command with values at the limits (assuming MIN_PLAYERS_LIMIT is 1)
    const command = new UpdateRoomRulesCommand(
      customRoomId,
      ownerId,
      1, // Minimum allowed players
      true,
      20, // Minimum latency
      128000 // Maximum bitrate
    );
    
    // Handle command
    await commandHandler.handle(command);
    
    // Get updated room
    const room = await roomRepository.findById(customRoomId);
    expect(room).not.toBeNull();
    
    if (room) {
      // Values should be at the limits
      expect(room.rules.maxPlayers).toBe(1);
      expect(room.rules.latencyTargetMs).toBe(20);
      expect(room.rules.opusBitrate).toBe(128000);
    }
  });
}); 