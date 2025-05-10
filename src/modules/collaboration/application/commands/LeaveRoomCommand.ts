import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';

/**
 * Command to make a player leave a room
 */
export class LeaveRoomCommand {
  constructor(
    public readonly roomId: RoomId,
    public readonly peerId: PeerId
  ) {}
} 