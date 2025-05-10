import 'reflect-metadata';
import { CreateRoomCommandHandler } from '../../application/handlers/CreateRoomCommandHandler';
import { CreateRoomCommand } from '../../application/commands/CreateRoomCommand';
import { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import { InMemoryRoomRepository } from '../../infrastructure/repositories/InMemoryRoomRepository';
import { IEventBus } from '../../../../core/event-bus/IEventBus';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import { UniqueId } from '../../../../shared/domain/value-objects/UniqueId';
import { v4 as uuidv4 } from 'uuid';

// Initialize UUID generators
UniqueId.initialize();
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

describe('CreateRoomCommandHandler', () => {
  let roomRepository: IRoomRepository;
  let eventBus: MockEventBus;
  let commandHandler: CreateRoomCommandHandler;
  
  beforeEach(() => {
    roomRepository = new InMemoryRoomRepository();
    eventBus = new MockEventBus();
    commandHandler = new CreateRoomCommandHandler(roomRepository, eventBus);
  });
  
  test('should create a room and return room ID', async () => {
    // Create test data
    const ownerId = PeerId.create();
    const ownerUsername = 'TestOwner';
    const roomName = 'Test Room';
    
    // Create command
    const command = new CreateRoomCommand(
      ownerId,
      ownerUsername,
      roomName,
      4, // maxPlayers
      true, // allowRelay
      100, // latencyTargetMs
      32000 // opusBitrate
    );
    
    // Handle command
    const roomId = await commandHandler.handle(command);
    
    // Verify room ID is returned
    expect(roomId).toBeDefined();
    expect(roomId instanceof RoomId).toBe(true);
    
    // Verify room was saved to repository
    const room = await roomRepository.findById(roomId);
    expect(room).not.toBeNull();
    
    // Verify room properties
    if (room) {
      expect(room.ownerId).toEqual(ownerId);
      expect(room.name).toBe(roomName);
      expect(room.playerCount).toBe(1);
      
      // Verify room rules
      expect(room.rules.maxPlayers).toBe(4);
      expect(room.rules.allowRelay).toBe(true);
      expect(room.rules.latencyTargetMs).toBe(100);
      expect(room.rules.opusBitrate).toBe(32000);
      
      // Verify owner is in the room
      const owner = room.getPlayer(ownerId);
      expect(owner).toBeDefined();
      expect(owner?.username).toBe(ownerUsername);
    }
    
    // Verify event was published
    expect(eventBus.publishedEvents.length).toBe(1);
    expect(eventBus.publishedEvents[0].eventType).toBe('collab.room-created');
  });
  
  test('should create a room with default rules when not specified', async () => {
    // Create test data
    const ownerId = PeerId.create();
    const ownerUsername = 'TestOwner';
    const roomName = 'Test Room';
    
    // Create command with minimal parameters (using default rules)
    const command = new CreateRoomCommand(
      ownerId,
      ownerUsername,
      roomName
    );
    
    // Handle command
    const roomId = await commandHandler.handle(command);
    
    // Verify room was saved
    const room = await roomRepository.findById(roomId);
    expect(room).not.toBeNull();
    
    // Verify default rules were applied
    if (room) {
      expect(room.rules.maxPlayers).toBe(4); // Default maxPlayers
      expect(room.rules.allowRelay).toBe(true); // Default allowRelay
      expect(room.rules.latencyTargetMs).toBe(100); // Default latencyTargetMs
      expect(room.rules.opusBitrate).toBe(32000); // Default opusBitrate
    }
  });
}); 