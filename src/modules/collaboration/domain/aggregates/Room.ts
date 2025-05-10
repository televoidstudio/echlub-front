import { AggregateRoot, DomainEvent } from '../../../../shared/domain';
import { RoomId } from '../value-objects/RoomId';
import { PeerId } from '../value-objects/PeerId';
import { RoomRuleVO } from '../value-objects/RoomRuleVO';
import { Peer } from '../entities/Peer';
import { RoomCreatedEvent } from '../events/RoomCreatedEvent';
import { PlayerJoinedEvent } from '../events/PlayerJoinedEvent';
import { PlayerLeftEvent } from '../events/PlayerLeftEvent';
import { RoomRuleChangedEvent } from '../events/RoomRuleChangedEvent';
import { RoomClosedEvent } from '../events/RoomClosedEvent';

/**
 * Room status enum
 */
export enum RoomStatus {
  CREATED = 'created',
  ACTIVE = 'active',
  CLOSED = 'closed'
}

/**
 * Room aggregate root
 * Manages room lifecycle and player management
 */
export class Room extends AggregateRoot {
  private readonly _roomId: RoomId;
  private readonly _ownerId: PeerId;
  private readonly _name: string;
  private _rules: RoomRuleVO;
  private _status: RoomStatus;
  private _players: Map<string, Peer>;
  private _closedAt: Date | null;
  private _version: number = 0;

  private constructor(
    roomId: RoomId,
    ownerId: PeerId,
    name: string,
    rules: RoomRuleVO,
    createdAt: Date,
    status: RoomStatus = RoomStatus.CREATED
  ) {
    super(createdAt, createdAt);
    this._roomId = roomId;
    this._ownerId = ownerId;
    this._name = name;
    this._rules = rules;
    this._status = status;
    this._players = new Map<string, Peer>();
    this._closedAt = null;
  }

  /**
   * Create a new room
   */
  public static create(
    roomId: RoomId,
    ownerId: PeerId,
    ownerUsername: string,
    name: string,
    rules: RoomRuleVO
  ): Room {
    const now = new Date();
    const room = new Room(roomId, ownerId, name, rules, now);

    // Add owner as the first participant
    const ownerPeer = new Peer(ownerId, ownerUsername, now);
    room._players.set(ownerId.toString(), ownerPeer);

    // Publish room creation event
    room.addDomainEvent(new RoomCreatedEvent(roomId, ownerId, name, rules));
    room.incrementVersion();

    return room;
  }

  /**
   * Get aggregate version
   */
  public getVersion(): number {
    return this._version;
  }

  /**
   * Increment aggregate version
   */
  public incrementVersion(): void {
    this._version += 1;
  }

  /**
   * Override addDomainEvent to also increment version
   */
  public override addDomainEvent(event: DomainEvent): void {
    super.addDomainEvent(event);
    this.incrementVersion();
  }

  /**
   * Player joins the room
   */
  public joinPlayer(peerId: PeerId, username: string): void {
    // Check room status
    if (this._status === RoomStatus.CLOSED) {
      throw new Error('Cannot join a closed room');
    }

    // Check if player is already in the room
    if (this._players.has(peerId.toString())) {
      throw new Error('Player already in room');
    }

    // Check if room is at capacity
    if (!this._rules.isValidFor(this._players.size + 1)) {
      throw new Error(`Room is at maximum player capacity: ${this._rules.maxPlayers}`);
    }

    // Create and add new player
    const now = new Date();
    const peer = new Peer(peerId, username, now);
    this._players.set(peerId.toString(), peer);

    // If only the owner is present (status CREATED), joining a second player changes to ACTIVE
    if (this._status === RoomStatus.CREATED && this._players.size > 1) {
      this._status = RoomStatus.ACTIVE;
    }

    // Publish player joined event
    this.addDomainEvent(new PlayerJoinedEvent(this._roomId, peerId, username, now));
    this.updateTimestamp();
  }

  /**
   * Player leaves the room
   */
  public leavePlayer(peerId: PeerId): void {
    // Check if room is closed
    if (this._status === RoomStatus.CLOSED) {
      throw new Error('Room is already closed');
    }

    // Check if player is in the room
    if (!this._players.has(peerId.toString())) {
      throw new Error('Player not in room');
    }

    // Remove player
    this._players.delete(peerId.toString());

    // Publish player left event
    this.addDomainEvent(new PlayerLeftEvent(this._roomId, peerId));

    // If owner leaves, close the room
    if (peerId.toString() === this._ownerId.toString()) {
      this.close();
    } else if (this._players.size === 1 && this._status === RoomStatus.ACTIVE) {
      // If only the owner remains, change status to CREATED
      this._status = RoomStatus.CREATED;
    }

    this.updateTimestamp();
  }

  /**
   * Update room rules
   */
  public updateRules(rules: RoomRuleVO): void {
    // Check if room is closed
    if (this._status === RoomStatus.CLOSED) {
      throw new Error('Cannot update rules for a closed room');
    }

    // Check if new rules are valid for current player count
    if (!rules.isValidFor(this._players.size)) {
      throw new Error(`New maximum player limit ${rules.maxPlayers} is less than current player count ${this._players.size}`);
    }

    this._rules = rules;

    // Publish rule update event
    this.addDomainEvent(new RoomRuleChangedEvent(this._roomId, rules));

    this.updateTimestamp();
  }

  /**
   * Close the room
   */
  public close(): void {
    if (this._status === RoomStatus.CLOSED) {
      return; // Already closed, no need to close again
    }

    this._status = RoomStatus.CLOSED;
    this._closedAt = new Date();

    // Publish room closed event
    this.addDomainEvent(new RoomClosedEvent(this._roomId, this._closedAt));

    this.updateTimestamp();
  }

  /**
   * Check if the specified user is the owner
   */
  public isOwner(peerId: PeerId): boolean {
    return this._ownerId.toString() === peerId.toString();
  }

  /**
   * Get room ID
   */
  public get roomId(): RoomId {
    return this._roomId;
  }

  /**
   * Get owner ID
   */
  public get ownerId(): PeerId {
    return this._ownerId;
  }

  /**
   * Get room name
   */
  public get name(): string {
    return this._name;
  }

  /**
   * Get room rules
   */
  public get rules(): RoomRuleVO {
    return this._rules;
  }

  /**
   * Get room status
   */
  public get status(): RoomStatus {
    return this._status;
  }

  /**
   * Get room closed timestamp
   */
  public get closedAt(): Date | null {
    return this._closedAt;
  }

  /**
   * Get all players list
   */
  public get players(): Peer[] {
    return Array.from(this._players.values());
  }

  /**
   * Get player count
   */
  public get playerCount(): number {
    return this._players.size;
  }

  /**
   * Get a specific player by ID
   */
  public getPlayer(peerId: PeerId): Peer | undefined {
    return this._players.get(peerId.toString());
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): object {
    return {
      roomId: this._roomId.toString(),
      ownerId: this._ownerId.toString(),
      name: this._name,
      status: this._status,
      rules: {
        maxPlayers: this._rules.maxPlayers,
        allowRelay: this._rules.allowRelay,
        latencyTargetMs: this._rules.latencyTargetMs,
        opusBitrate: this._rules.opusBitrate
      },
      playerCount: this._players.size,
      players: this.players.map(player => player.toJSON()),
      createdAt: this.createdAt.toISOString(),
      closedAt: this._closedAt ? this._closedAt.toISOString() : null,
      version: this.getVersion()
    };
  }
} 