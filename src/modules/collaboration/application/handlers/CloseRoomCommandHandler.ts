import { injectable, inject } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { CloseRoomCommand } from '../commands/CloseRoomCommand';
import type { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

/**
 * Handler for close room command
 * Closes a room and notifies all participants
 */
@injectable()
export class CloseRoomCommandHandler {
  constructor(
    @inject(CollaborationTypes.RoomRepository)
    private readonly roomRepository: IRoomRepository,
    
    @inject(CollaborationTypes.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Handle the close room command
   * Closes the room if the requester is the owner
   */
  async handle(command: CloseRoomCommand): Promise<void> {
    // Find room
    const room = await this.roomRepository.findById(command.roomId);
    
    if (!room) {
      throw new Error(`Room not found: ${command.roomId.toString()}`);
    }
    
    // Verify caller is the room owner
    if (!room.ownerId.equals(command.ownerId)) {
      throw new Error('Only the room owner can close the room');
    }
    
    // Close the room
    room.close();
    
    // Delete the room (or mark as closed, depending on persistence strategy)
    await this.roomRepository.delete(command.roomId);
    
    // Publish domain events
    const domainEvents = room.getDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    
    // Clear published events
    room.clearDomainEvents();
  }
} 