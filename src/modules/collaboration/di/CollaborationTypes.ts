export const CollaborationTypes = {
  // Repositories
  RoomRepository: Symbol.for('RoomRepository'),
  
  // Commands
  CreateRoomCommand: Symbol.for('CreateRoomCommand'),
  JoinRoomCommand: Symbol.for('JoinRoomCommand'),
  LeaveRoomCommand: Symbol.for('LeaveRoomCommand'),
  UpdateRoomRulesCommand: Symbol.for('UpdateRoomRulesCommand'),
  CloseRoomCommand: Symbol.for('CloseRoomCommand'),
  
  // Handlers
  CreateRoomCommandHandler: Symbol.for('CreateRoomCommandHandler'),
  JoinRoomCommandHandler: Symbol.for('JoinRoomCommandHandler'),
  LeaveRoomCommandHandler: Symbol.for('LeaveRoomCommandHandler'),
  UpdateRoomRulesCommandHandler: Symbol.for('UpdateRoomRulesCommandHandler'),
  CloseRoomCommandHandler: Symbol.for('CloseRoomCommandHandler'),
  
  // Services
  CollaborationService: Symbol.for('CollaborationService'),
  
  // Adapters
  SignalHubAdapter: Symbol.for('SignalHubAdapter'),
  WebRTCAdapter: Symbol.for('WebRTCAdapter'),
  LocalCacheAdapter: Symbol.for('LocalCacheAdapter'),
  CollaborationApiAdapter: Symbol.for('CollaborationApiAdapter'),
  
  // Event Bus
  EventBus: Symbol.for('EventBus'),
}; 