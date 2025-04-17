import { Container } from 'inversify';
import { TrackTypes } from './TrackTypes';
import { ITrackRepository, ILocalTrackRepository, IWebSocketTrackRepository, IWebRTCTrackRepository } from '../domain/repositories/ITrackRepository';
import { LocalTrackRepository } from '../infrastructure/persistence/LocalTrackRepository';
import { WebSocketTrackRepository } from '../infrastructure/persistence/WebSocketTrackRepository';
import { WebRTCTrackRepository } from '../infrastructure/persistence/WebRTCTrackRepository';
import { TrackRepositoryCoordinator } from '../infrastructure/persistence/TrackRepositoryCoordinator';
import { TrackService } from '../application/services/TrackService';
import { TrackDomainService } from '../domain/services/TrackDomainService';
import { TrackValidator } from '../application/validators/TrackValidator';
import { TrackMediator } from '../application/mediators/TrackMediator';
import { TrackFactory } from '../domain/factories/TrackFactory';
import { TrackEventHandler } from '../integration/handlers/TrackEventHandler';
import { CreateTrackCommandHandler } from '../application/handlers/CreateTrackCommandHandler';
import { RenameTrackCommandHandler } from '../application/handlers/RenameTrackCommandHandler';
import { AddClipToTrackCommandHandler } from '../application/handlers/AddClipToTrackCommandHandler';
import { RemoveClipFromTrackCommandHandler } from '../application/handlers/RemoveClipFromTrackCommandHandler';
import { ChangeTrackRoutingCommandHandler } from '../application/handlers/ChangeTrackRoutingCommandHandler';
import { AddPluginToTrackCommandHandler } from '../application/handlers/AddPluginToTrackCommandHandler';
import { RemovePluginFromTrackCommandHandler } from '../application/handlers/RemovePluginFromTrackCommandHandler';

export class TrackModule {
  static configure(container: Container): void {
    // Repositories
    container.bind<ILocalTrackRepository>(TrackTypes.LocalTrackRepository)
      .to(LocalTrackRepository)
      .inSingletonScope();

    container.bind<IWebSocketTrackRepository>(TrackTypes.WebSocketTrackRepository)
      .to(WebSocketTrackRepository)
      .inSingletonScope();

    container.bind<IWebRTCTrackRepository>(TrackTypes.WebRTCTrackRepository)
      .to(WebRTCTrackRepository)
      .inSingletonScope();

    container.bind<ITrackRepository>(TrackTypes.TrackRepository)
      .to(TrackRepositoryCoordinator)
      .inSingletonScope();

    // Services
    container.bind(TrackTypes.TrackService)
      .to(TrackService)
      .inSingletonScope();

    container.bind(TrackTypes.TrackDomainService)
      .to(TrackDomainService)
      .inSingletonScope();

    container.bind(TrackTypes.TrackValidator)
      .to(TrackValidator)
      .inSingletonScope();

    // Mediators
    container.bind(TrackTypes.TrackMediator)
      .to(TrackMediator)
      .inSingletonScope();

    // Factories
    container.bind(TrackTypes.TrackFactory)
      .to(TrackFactory)
      .inSingletonScope();

    // Event Handlers
    container.bind(TrackTypes.TrackEventHandler)
      .to(TrackEventHandler)
      .inSingletonScope();

    // Command Handlers
    container.bind(TrackTypes.CreateTrackCommandHandler)
      .to(CreateTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.RenameTrackCommandHandler)
      .to(RenameTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.AddClipToTrackCommandHandler)
      .to(AddClipToTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.RemoveClipFromTrackCommandHandler)
      .to(RemoveClipFromTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.ChangeTrackRoutingCommandHandler)
      .to(ChangeTrackRoutingCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.AddPluginToTrackCommandHandler)
      .to(AddPluginToTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.RemovePluginFromTrackCommandHandler)
      .to(RemovePluginFromTrackCommandHandler)
      .inSingletonScope();
  }
} 