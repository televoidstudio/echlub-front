import { UniqueId } from '../UniqueId';

/**
 * 數字類型的 ID 值對象示例
 * 展示如何使用數字作為 ID 值
 */
export class NumericId extends UniqueId<number> {
  /**
   * 創建新的 NumericId，使用自增序列
   */
  private static counter = 0;
  
  public static create(): NumericId {
    return new NumericId(++NumericId.counter);
  }
  
  /**
   * 從數字創建 NumericId
   */
  public static fromNumber(id: number): NumericId {
    if (!NumericId.isValid(id)) {
      throw new Error('無效的數字ID格式');
    }
    return new NumericId(id);
  }
  
  /**
   * 檢查是否為有效的數字ID
   */
  public static isValid(id: number): boolean {
    return id !== null && id !== undefined && !isNaN(id) && id > 0;
  }
} 