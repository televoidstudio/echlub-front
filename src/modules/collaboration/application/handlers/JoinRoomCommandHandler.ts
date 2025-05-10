import { injectable, inject } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { JoinRoomCommand } from '../commands/JoinRoomCommand';
import type { IRoomRepository } from '../../domain/repositories/IRoomRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

/**
 * Handler for join room command
 */
@injectable()
export class JoinRoomCommandHandler {
  constructor(
    @inject(CollaborationTypes.RoomRepository)
    private readonly roomRepository: IRoomRepository,
    
    @inject(CollaborationTypes.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Handle join room command, add player to room
   */
  async handle(command: JoinRoomCommand): Promise<void> {
    // Find room
    const room = await this.roomRepository.findById(command.roomId);
    
    if (!room) {
      throw new Error(`Room not found: ${command.roomId.toString()}`);
    }
    
    // Add player to room
    room.joinPlayer(command.peerId, command.username);
    
    // Save room
    await this.roomRepository.save(room);
    
    // Publish domain events
    const domainEvents = room.getDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    
    // Clear published events
    room.clearDomainEvents();
  }
} 