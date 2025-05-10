import 'reflect-metadata';
import { Room, RoomStatus } from '../../domain/aggregates/Room';
import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomRuleVO } from '../../domain/value-objects/RoomRuleVO';
import { UniqueId } from '../../../../shared/domain/value-objects/UniqueId';
import { v4 as uuidv4 } from 'uuid';

// Initialize UUID generators
UniqueId.initialize();
RoomId.setGenerator(() => uuidv4());
PeerId.setGenerator(() => uuidv4());

describe('Room Aggregate', () => {
  // Test data
  let roomId: RoomId;
  let ownerId: PeerId;
  let ownerUsername: string;
  let roomName: string;
  let rules: RoomRuleVO;
  
  beforeEach(() => {
    roomId = RoomId.create();
    ownerId = PeerId.create();
    ownerUsername = 'RoomOwner';
    roomName = 'Test Room';
    rules = RoomRuleVO.create(4, true, 100, 32000);
  });

  test('should create a room with the owner as the first player', () => {
    // Create room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    
    // Verify room properties
    expect(room.roomId).toEqual(roomId);
    expect(room.ownerId).toEqual(ownerId);
    expect(room.name).toBe(roomName);
    expect(room.playerCount).toBe(1);
    expect(room.status).toBe(RoomStatus.CREATED);
    
    // Verify owner is included as player
    const owner = room.getPlayer(ownerId);
    expect(owner).toBeDefined();
    expect(owner?.username).toBe(ownerUsername);
    
    // Verify domain events
    const events = room.getDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('collab.room-created');
  });

  test('should allow players to join the room', () => {
    // Create room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    room.clearDomainEvents();
    
    // Add a player
    const peerId = PeerId.create();
    const username = 'TestPlayer';
    room.joinPlayer(peerId, username);
    
    // Verify player count and status
    expect(room.playerCount).toBe(2);
    expect(room.status).toBe(RoomStatus.ACTIVE);
    
    // Verify player is in the room
    const player = room.getPlayer(peerId);
    expect(player).toBeDefined();
    expect(player?.username).toBe(username);
    
    // Verify domain events
    const events = room.getDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('collab.player-joined');
  });

  test('should throw error when player is already in the room', () => {
    // Create room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    room.clearDomainEvents();
    
    // Add a player
    const peerId = PeerId.create();
    const username = 'TestPlayer';
    room.joinPlayer(peerId, username);
    
    // Try to add the same player again
    expect(() => {
      room.joinPlayer(peerId, username);
    }).toThrow(/Player already in room/);
  });

  test('should throw error when room is at maximum capacity', () => {
    // Create room with max 2 players
    const smallRules = RoomRuleVO.create(2);
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, smallRules);
    room.clearDomainEvents();
    
    // Add first player (bringing the total to 2 with the owner)
    const peerId = PeerId.create();
    room.joinPlayer(peerId, 'Player1');
    
    // Try to add another player
    expect(() => {
      room.joinPlayer(PeerId.create(), 'Player2');
    }).toThrow(/Room is at maximum player capacity/);
  });

  test('should allow players to leave the room', () => {
    // Create room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    
    // Add a player
    const peerId = PeerId.create();
    const username = 'TestPlayer';
    room.joinPlayer(peerId, username);
    room.clearDomainEvents();
    
    // Player leaves
    room.leavePlayer(peerId);
    
    // Verify player count
    expect(room.playerCount).toBe(1);
    
    // Verify player is not in the room
    const player = room.getPlayer(peerId);
    expect(player).toBeUndefined();
    
    // Verify domain events
    const events = room.getDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('collab.player-left');
  });

  test('should allow changing room rules', () => {
    // Create room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    room.clearDomainEvents();
    
    // Change rules
    const newRules = RoomRuleVO.create(6, false, 200, 64000);
    room.updateRules(newRules);
    
    // Verify rules updated
    expect(room.rules.maxPlayers).toBe(6);
    expect(room.rules.allowRelay).toBe(false);
    expect(room.rules.latencyTargetMs).toBe(200);
    expect(room.rules.opusBitrate).toBe(64000);
    
    // Verify domain events
    const events = room.getDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('collab.room-rule-changed');
  });

  test('should close the room', () => {
    // Create room
    const room = Room.create(roomId, ownerId, ownerUsername, roomName, rules);
    room.clearDomainEvents();
    
    // Close the room
    room.close();
    
    // Verify room status
    expect(room.status).toBe(RoomStatus.CLOSED);
    expect(room.closedAt).toBeDefined();
    
    // Verify domain events
    const events = room.getDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('collab.room-closed');
  });
}); 