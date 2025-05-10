import { ValueObject } from '../../../../shared/domain';

interface RoomRuleProps {
  maxPlayers: number;
  allowRelay: boolean;
  latencyTargetMs: number;
  opusBitrate: number;
}

/**
 * Room rule value object
 * Contains all configuration properties for a room
 */
export class RoomRuleVO extends ValueObject<RoomRuleProps> {
  private static readonly MAX_PLAYERS_LIMIT = 10;
  private static readonly MIN_PLAYERS_LIMIT = 1;
  private static readonly DEFAULT_LATENCY_TARGET_MS = 100;
  private static readonly DEFAULT_OPUS_BITRATE = 32000;

  /**
   * Create a room rule value object
   * @param maxPlayers Maximum number of players (1-10)
   * @param allowRelay Whether to allow relay connections
   * @param latencyTargetMs Target latency time (milliseconds)
   * @param opusBitrate Opus encoding bitrate
   */
  private constructor(props: RoomRuleProps) {
    super(props);
  }

  /**
   * Implement equalsCore as required by ValueObject abstract class
   */
  protected equalsCore(other: ValueObject<RoomRuleProps>): boolean {
    const otherRule = other as RoomRuleVO;
    return this.maxPlayers === otherRule.maxPlayers &&
           this.allowRelay === otherRule.allowRelay &&
           this.latencyTargetMs === otherRule.latencyTargetMs &&
           this.opusBitrate === otherRule.opusBitrate;
  }

  /**
   * Factory method to create room rules
   */
  public static create(
    maxPlayers: number = 4,
    allowRelay: boolean = true,
    latencyTargetMs: number = RoomRuleVO.DEFAULT_LATENCY_TARGET_MS,
    opusBitrate: number = RoomRuleVO.DEFAULT_OPUS_BITRATE
  ): RoomRuleVO {
    if (maxPlayers < RoomRuleVO.MIN_PLAYERS_LIMIT || maxPlayers > RoomRuleVO.MAX_PLAYERS_LIMIT) {
      throw new Error(`Maximum player count must be between ${RoomRuleVO.MIN_PLAYERS_LIMIT} and ${RoomRuleVO.MAX_PLAYERS_LIMIT}`);
    }

    return new RoomRuleVO({
      maxPlayers,
      allowRelay,
      latencyTargetMs,
      opusBitrate
    });
  }

  /**
   * Copy and create new room rules
   */
  public update(
    maxPlayers?: number,
    allowRelay?: boolean,
    latencyTargetMs?: number,
    opusBitrate?: number
  ): RoomRuleVO {
    return RoomRuleVO.create(
      maxPlayers ?? this.maxPlayers,
      allowRelay ?? this.allowRelay,
      latencyTargetMs ?? this.latencyTargetMs,
      opusBitrate ?? this.opusBitrate
    );
  }

  /**
   * Check if room rules are valid for the specified number of players
   */
  public isValidFor(currentPlayers: number): boolean {
    return currentPlayers <= this.maxPlayers && currentPlayers >= RoomRuleVO.MIN_PLAYERS_LIMIT;
  }
  
  /**
   * Get maximum number of players
   */
  get maxPlayers(): number {
    return this.props.maxPlayers;
  }

  /**
   * Whether to allow relay connections
   */
  get allowRelay(): boolean {
    return this.props.allowRelay;
  }

  /**
   * Get target latency time (milliseconds)
   */
  get latencyTargetMs(): number {
    return this.props.latencyTargetMs;
  }

  /**
   * Get Opus encoding bitrate
   */
  get opusBitrate(): number {
    return this.props.opusBitrate;
  }
} 