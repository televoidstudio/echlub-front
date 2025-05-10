import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';

/**
 * Command to close a room
 */
export class CloseRoomCommand {
  constructor(
    public readonly roomId: RoomId,
    public readonly ownerId: PeerId
  ) {}
} 