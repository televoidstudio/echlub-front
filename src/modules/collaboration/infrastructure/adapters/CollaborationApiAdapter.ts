import { injectable } from 'inversify';
import { 
  ICollaborationApiAdapter, 
  CreateRoomRequest, 
  UpdateRoomRulesRequest, 
  CloseRoomRequest, 
  ApiResponse, 
  RoomResponse 
} from './ICollaborationApiAdapter';
import { RoomId } from '../../domain/value-objects/RoomId';

/**
 * Collaboration API Adapter Implementation
 */
@injectable()
export class CollaborationApiAdapter implements ICollaborationApiAdapter {
  private readonly API_BASE_URL: string = import.meta.env.VITE_API_URL || 'https://api.echlub.com';
  
  /**
   * Create a new room
   */
  async createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/collaboration/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          owner_id: request.ownerId,
          max_players: request.maxPlayers,
          allow_relay: request.allowRelay,
          latency_target_ms: request.latencyTargetMs,
          opus_bitrate: request.opusBitrate
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.error || `Failed to create room: ${response.statusText}`
        };
      }
      
      return { 
        data: { 
          roomId: data.room_id 
        },
        message: data.message
      };
    } catch (error) {
      console.error('Error creating room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error creating room'
      };
    }
  }
  
  /**
   * Get room status
   */
  async getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/collaboration/rooms/${roomId.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.error || `Failed to get room: ${response.statusText}`
        };
      }
      
      return { 
        data: {
          id: data.room_id,
          ownerId: data.owner_id,
          active: data.active,
          maxPlayers: data.max_players,
          currentPlayers: data.current_players,
          rules: {
            maxPlayers: data.rules.max_players,
            allowRelay: data.rules.allow_relay,
            latencyTargetMs: data.rules.latency_target_ms,
            opusBitrate: data.rules.opus_bitrate
          }
        }
      };
    } catch (error) {
      console.error('Error getting room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error getting room'
      };
    }
  }
  
  /**
   * Update room rules
   */
  async updateRoomRules(roomId: RoomId, request: UpdateRoomRulesRequest): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/collaboration/rooms/${roomId.toString()}/rules`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          owner_id: request.ownerId,
          max_players: request.maxPlayers,
          allow_relay: request.allowRelay,
          latency_target_ms: request.latencyTargetMs,
          opus_bitrate: request.opusBitrate
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        return {
          error: data.error || `Failed to update room rules: ${response.statusText}`
        };
      }
      
      return {
        message: 'Room rules updated successfully'
      };
    } catch (error) {
      console.error('Error updating room rules:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error updating room rules'
      };
    }
  }
  
  /**
   * Close room
   */
  async closeRoom(roomId: RoomId, request: CloseRoomRequest): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/collaboration/rooms/${roomId.toString()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          owner_id: request.ownerId
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        return {
          error: data.error || `Failed to close room: ${response.statusText}`
        };
      }
      
      return {
        message: 'Room closed successfully'
      };
    } catch (error) {
      console.error('Error closing room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error closing room'
      };
    }
  }
} 