import { DomainEvent } from '../events/DomainEvent';

/**
 * 聚合根接口
 * 定義聚合根應當具備的領域事件管理能力
 */
export interface IAggregateRoot {
  /**
   * 獲取該聚合根產生的所有尚未提交的領域事件
   */
  getDomainEvents(): DomainEvent[];
  
  /**
   * 清除該聚合根上所有已處理的領域事件
   */
  clearDomainEvents(): void;
  
  /**
   * 添加領域事件
   */
  addDomainEvent(event: DomainEvent): void;
} 