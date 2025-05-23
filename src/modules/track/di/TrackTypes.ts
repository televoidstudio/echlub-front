export const TrackTypes = {
  // Repositories
  TrackRepository: Symbol.for('TrackRepository'),
  LocalTrackRepository: Symbol.for('LocalTrackRepository'),
  WebSocketTrackRepository: Symbol.for('WebSocketTrackRepository'),
  WebRTCTrackRepository: Symbol.for('WebRTCTrackRepository'),
  
  // Services
  TrackService: Symbol.for('TrackService'),
  TrackDomainService: Symbol.for('TrackDomainService'),
  TrackValidator: Symbol.for('TrackValidator'),
  
  // Commands
  CreateTrackCommandHandler: Symbol.for('CreateTrackCommandHandler'),
  RenameTrackCommandHandler: Symbol.for('RenameTrackCommandHandler'),
  AddClipToTrackCommandHandler: Symbol.for('AddClipToTrackCommandHandler'),
  RemoveClipFromTrackCommandHandler: Symbol.for('RemoveClipFromTrackCommandHandler'),
  ChangeTrackRoutingCommandHandler: Symbol.for('ChangeTrackRoutingCommandHandler'),
  AddPluginToTrackCommandHandler: Symbol.for('AddPluginToTrackCommandHandler'),
  RemovePluginFromTrackCommandHandler: Symbol.for('RemovePluginFromTrackCommandHandler'),
  AddInputTrackToBusCommandHandler: Symbol.for('AddInputTrackToBusCommandHandler'),
  RemoveInputTrackFromBusCommandHandler: Symbol.for('RemoveInputTrackFromBusCommandHandler'),
  
  // Mediators
  TrackMediator: Symbol.for('TrackMediator'),
  
  // Factories
  TrackFactory: Symbol.for('TrackFactory'),
  
  // Event Handlers
  TrackEventHandler: Symbol.for('TrackEventHandler'),
  
  // Specifications
  TrackSpecification: Symbol.for('TrackSpecification'),

  // Core Dependencies
  EventBus: Symbol.for('EventBus'),
  StateManager: Symbol.for('StateManager'),

  // New PluginReferenceAdapter
  PluginReferenceAdapter: Symbol.for('PluginReferenceAdapter'),

  // Track Factories
  AudioTrackFactory: Symbol.for('AudioTrackFactory'),
  InstrumentTrackFactory: Symbol.for('InstrumentTrackFactory'),
  BusTrackFactory: Symbol.for('BusTrackFactory'),
  TrackFactoryRegistry: Symbol.for('TrackFactoryRegistry'),

  // New TrackEventPublisher
  TrackEventPublisher: Symbol.for('TrackEventPublisher'),
}; 
