import 'reflect-metadata';
import { JoinRoomCommandHandler } from '../../application/handlers/JoinRoomCommandHandler';
import { JoinRoomCommand } from '../../application/commands/JoinRoomCommand';
import { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { InMemoryRoomRepository } from '../../infrastructure/repositories/InMemoryRoomRepository';
import { IEventBus } from '../../../../core/event-bus/IEventBus';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import { Room, RoomStatus } from '../../domain/aggregates/Room';
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

describe('JoinRoomCommandHandler', () => {
  let roomRepository: IRoomRepository;
  let eventBus: MockEventBus;
  let commandHandler: JoinRoomCommandHandler;
  
  // Test room data
  const roomId = RoomId.create();
  const ownerId = PeerId.create();
  const ownerUsername = 'RoomOwner';
  const roomName = 'Test Room';
  const rules = RoomRuleVO.create(4, true, 100, 32000);
  
  beforeEach(async () => {
    roomRepository = new InMemoryRoomRepository();
    eventBus = new MockEventBus();
    commandHandler = new JoinRoomCommandHandler(roomRepository, eventBus);
    
    // Create test room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    await roomRepository.save(room);
    
    // Clear events generated during room creation
    room.clearDomainEvents();
  });
  
  test('should allow a player to join a room', async () => {
    // Create test data
    const peerId = PeerId.create();
    const username = 'TestPlayer';
    
    // Create command
    const command = new JoinRoomCommand(roomId, peerId, username);
    
    // Handle command
    await commandHandler.handle(command);
    
    // Verify player has joined the room
    const room = await roomRepository.findById(roomId);
    expect(room).not.toBeNull();
    expect(room?.playerCount).toBe(2);
    expect(room?.status).toBe(RoomStatus.ACTIVE);
    
    // Confirm specific player has joined
    const player = room?.getPlayer(peerId);
    expect(player).not.toBeUndefined();
    expect(player?.username).toBe(username);
    
    // Verify event was published
    expect(eventBus.publishedEvents.length).toBe(1);
    expect(eventBus.publishedEvents[0].eventType).toBe('collab.player-joined');
  });
  
  test('should throw an error when room does not exist', async () => {
    // Create test data
    const nonExistentRoomId = RoomId.create();
    const peerId = PeerId.create();
    const username = 'TestPlayer';
    
    // Create command
    const command = new JoinRoomCommand(nonExistentRoomId, peerId, username);
    
    // Expect error when handling command
    await expect(commandHandler.handle(command)).rejects.toThrow(/Room not found/);
  });
  
  test('should throw an error when player is already in the room', async () => {
    // Create first player join command
    const peerId = PeerId.create();
    const username = 'TestPlayer';
    const command1 = new JoinRoomCommand(roomId, peerId, username);
    
    // Handle first command
    await commandHandler.handle(command1);
    
    // Clear event records
    eventBus.publishedEvents = [];
    
    // Create second command for the same player
    const command2 = new JoinRoomCommand(roomId, peerId, username);
    
    // Expect error on second handling
    await expect(commandHandler.handle(command2)).rejects.toThrow(/Player already in room/);
  });
  
  test('should throw an error when room is full', async () => {
    // Create a room that only allows 2 people
    const smallRoomId = RoomId.create();
    const smallRoom = Room.create(
      smallRoomId,
      ownerId,
      ownerUsername,
      'Small Room',
      RoomRuleVO.create(2)
    );
    await roomRepository.save(smallRoom);
    smallRoom.clearDomainEvents();
    
    // First player joins (with the owner makes two)
    const playerId1 = PeerId.create();
    const command1 = new JoinRoomCommand(smallRoomId, playerId1, 'Player1');
    await commandHandler.handle(command1);
    
    // Clear event records
    eventBus.publishedEvents = [];
    
    // Try to add a third player
    const playerId2 = PeerId.create();
    const command2 = new JoinRoomCommand(smallRoomId, playerId2, 'Player2');
    
    // Expect error
    await expect(commandHandler.handle(command2)).rejects.toThrow(/Room is at maximum player capacity/);
  });
}); 