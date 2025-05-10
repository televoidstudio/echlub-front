import { injectable, inject } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { LeaveRoomCommand } from '../commands/LeaveRoomCommand';
import type { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

/**
 * Handler for leave room command
 * Processes player leaving a room
 */
@injectable()
export class LeaveRoomCommandHandler {
  constructor(
    @inject(CollaborationTypes.RoomRepository)
    private readonly roomRepository: IRoomRepository,
    
    @inject(CollaborationTypes.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Handle the leave room command
   * Removes player from room and publishes events
   */
  async handle(command: LeaveRoomCommand): Promise<void> {
    // Find room
    const room = await this.roomRepository.findById(command.roomId);
    
    if (!room) {
      throw new Error(`Room not found: ${command.roomId.toString()}`);
    }
    
    // Process player leaving
    room.leavePlayer(command.peerId);
    
    // If room is not closed (room is closed if owner leaves)
    if (room.status !== 'closed') {
      await this.roomRepository.save(room);
    } else {
      // If room was closed (owner left), delete it
      await this.roomRepository.delete(command.roomId);
    }
    
    // Publish domain events
    const domainEvents = room.getDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    
    // Clear published events
    room.clearDomainEvents();
  }
} 