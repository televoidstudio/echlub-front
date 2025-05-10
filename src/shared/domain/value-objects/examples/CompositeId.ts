import { UniqueId } from '../UniqueId';

/**
 * 複合 ID 的屬性接口
 */
interface CompositeIdProps {
  namespace: string;
  localId: number;
  version: number;
}

/**
 * 複合 ID 值對象示例
 * 展示如何使用複雜對象作為 ID 值
 */
export class CompositeId extends UniqueId<CompositeIdProps> {
  private static sequenceCounter = 0;
  
  /**
   * 創建新的 CompositeId
   * 遵循基類實現方式，但允許使用自訂參數
   */
  public static override create(...args: any[]): CompositeId {
    const namespace = args[0] as string;
    const version = args[1] as number | undefined;
    
    if (!namespace) {
      throw new Error('CompositeId creation requires at least a namespace');
    }
    
    return new CompositeId({
      namespace,
      localId: ++CompositeId.sequenceCounter,
      version: version ?? 1
    });
  }
  
  /**
   * 獲取命名空間
   */
  public get namespace(): string {
    return this.value.namespace;
  }
  
  /**
   * 獲取本地 ID
   */
  public get localId(): number {
    return this.value.localId;
  }
  
  /**
   * 獲取版本
   */
  public get version(): number {
    return this.value.version;
  }
  
  /**
   * 更新版本（創建新的實例）
   */
  public incrementVersion(): CompositeId {
    return new CompositeId({
      namespace: this.value.namespace,
      localId: this.value.localId,
      version: this.value.version + 1
    });
  }
  
  /**
   * 從字符串解析複合 ID
   * 格式: namespace:localId:version
   */
  public static fromString(idString: string): CompositeId {
    const parts = idString.split(':');
    
    if (parts.length !== 3) {
      throw new Error('無效的複合ID格式，應為 namespace:localId:version');
    }
    
    const namespace = parts[0];
    const localId = parseInt(parts[1], 10);
    const version = parseInt(parts[2], 10);
    
    if (isNaN(localId) || isNaN(version) || localId <= 0 || version <= 0) {
      throw new Error('無效的複合ID: localId 和 version 必須是正整數');
    }
    
    return new CompositeId({ namespace, localId, version });
  }
  
  /**
   * 轉換為字符串表示
   */
  public toString(): string {
    return `${this.value.namespace}:${this.value.localId}:${this.value.version}`;
  }
} 