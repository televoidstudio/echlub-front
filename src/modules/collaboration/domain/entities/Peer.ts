import { Entity } from '../../../../shared/domain';
import { PeerId } from '../value-objects/PeerId';
import { ConnectionState } from '../value-objects/ConnectionState';

interface PeerProps {
  peerId: PeerId;
  username: string;
  joinedAt: Date;
  iceState: ConnectionState;
  relayState: ConnectionState;
}

/**
 * Represents a participant in a room
 */
export class Peer extends Entity {
  private readonly _peerId: PeerId;
  private readonly _username: string;
  private readonly _joinedAt: Date;
  private _iceState: ConnectionState;
  private _relayState: ConnectionState;

  constructor(
    peerId: PeerId,
    username: string,
    joinedAt: Date = new Date(),
    iceState: ConnectionState = ConnectionState.DISCONNECTED,
    relayState: ConnectionState = ConnectionState.DISCONNECTED
  ) {
    super(joinedAt, joinedAt);
    this._peerId = peerId;
    this._username = username;
    this._joinedAt = joinedAt;
    this._iceState = iceState;
    this._relayState = relayState;
  }

  /**
   * Get Peer ID
   */
  get peerId(): PeerId {
    return this._peerId;
  }

  /**
   * Get username
   */
  get username(): string {
    return this._username;
  }

  /**
   * Get join time
   */
  get joinedAt(): Date {
    return this._joinedAt;
  }

  /**
   * Get ICE connection state
   */
  get iceState(): ConnectionState {
    return this._iceState;
  }

  /**
   * Get relay connection state
   */
  get relayState(): ConnectionState {
    return this._relayState;
  }

  /**
   * Update ICE connection state
   */
  updateIceState(state: ConnectionState): void {
    this._iceState = state;
    this.updateTimestamp();
  }

  /**
   * Update relay connection state
   */
  updateRelayState(state: ConnectionState): void {
    this._relayState = state;
    this.updateTimestamp();
  }

  /**
   * Check if the peer is in connected state (via ICE or relay)
   */
  isConnected(): boolean {
    return (
      this._iceState === ConnectionState.CONNECTED ||
      this._relayState === ConnectionState.CONNECTED ||
      this._relayState === ConnectionState.RELAYING
    );
  }

  /**
   * Get the best connection state (prioritize direct ICE connection)
   */
  getBestConnectionState(): ConnectionState {
    if (this._iceState === ConnectionState.CONNECTED) {
      return ConnectionState.CONNECTED;
    }
    
    return this._relayState;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): PeerProps {
    return {
      peerId: this._peerId,
      username: this._username,
      joinedAt: this._joinedAt,
      iceState: this._iceState,
      relayState: this._relayState
    };
  }
} 