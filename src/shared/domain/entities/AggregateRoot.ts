import { Entity } from './Entity';
import { IAggregateRoot } from './IAggregateRoot';
import { DomainEvent } from '../events/DomainEvent';

/**
 * 聚合根基類
 * 所有聚合根都應繼承此類
 * 聚合根負責維護其邊界內的一致性，並管理領域事件
 */
export abstract class AggregateRoot extends Entity implements IAggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  /**
   * 添加領域事件
   * @param event 要添加的領域事件
   */
  public addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 獲取該聚合根產生的所有尚未提交的領域事件
   * @returns 領域事件陣列的副本
   */
  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * 清除該聚合根上所有已處理的領域事件
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
} 