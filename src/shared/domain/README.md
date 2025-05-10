# 共享領域組件

本目錄包含所有模塊共享的領域概念和基礎類。

## 目錄結構

```
src/shared/domain/
├── entities/            # 實體相關
│   ├── Entity.ts        # 所有實體的基類
│   └── IAggregateRoot.ts # 聚合根接口
├── events/              # 領域事件相關
│   └── DomainEvent.ts   # 領域事件基類
├── value-objects/       # 值對象相關
│   ├── ValueObject.ts   # 值對象基類
│   ├── UniqueId.ts      # 唯一標識符值對象
│   ├── ID.ts            # (已棄用) ID 值對象基類
│   └── UUID.ts          # (已棄用) UUID 值對象實現
└── index.ts             # 導出所有共享組件
```

## 使用方法

### 導入共享組件

```typescript
import { Entity, IAggregateRoot, DomainEvent, ValueObject, ID, UUID } from '../../../shared/domain';
```

### 創建實體

```typescript
export class MyEntity extends Entity {
  private readonly _id: string;
  
  constructor(id: string, createdAt: Date, updatedAt: Date) {
    super(createdAt, updatedAt);
    this._id = id;
  }
  
  get id(): string {
    return this._id;
  }
}
```

### 創建聚合根

```typescript
export class MyAggregateRoot extends Entity implements IAggregateRoot {
  private _version: number = 0;
  
  // 聚合根特定的業務邏輯
  // ...
  
  // 實現版本控制 (可選，但建議)
  getVersion(): number {
    return this._version;
  }
  
  incrementVersion(): void {
    this._version++;
  }
  
  // 必須實現 toJSON 方法以支持序列化
  toJSON(): object {
    return {
      // 實現序列化邏輯
    };
  }
}
```

### 創建領域事件

```typescript
export class MyEvent extends DomainEvent {
  constructor(
    public readonly entityId: string,
    public readonly data: any
  ) {
    super('MyEventName', entityId);
  }
}
```

### 創建值對象

```typescript
// 1. 定義值對象屬性接口
interface MyValueProps {
  value: string;
  description: string;
}

// 2. 繼承 ValueObject 基類
export class MyValue extends ValueObject<MyValueProps> {
  // 3. 實現構造函數
  constructor(props: MyValueProps) {
    super(props);
  }
  
  // 4. 實現相等性比較
  protected equalsCore(other: MyValue): boolean {
    return this.props.value === other.props.value;
  }
  
  // 5. 提供便利的訪問器
  get value(): string {
    return this.props.value;
  }
  
  get description(): string {
    return this.props.description;
  }
  
  // 6. 可以添加領域方法
  isValid(): boolean {
    return this.props.value.length > 0;
  }
}
```

### 使用 ID 值對象

```typescript
// 1. 字符串類型ID (UUID)
export class ProductId extends UniqueId<string> {
  public static create(): ProductId {
    if (!ProductId.generator) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return new ProductId(crypto.randomUUID());
      }
      throw new Error('沒有可用的 UUID 生成器');
    }
    return new ProductId(ProductId.generator());
  }
  
  public static fromString(id: string): ProductId {
    if (!ProductId.isValidUUID(id)) {
      throw new Error('無效的商品ID格式');
    }
    return new ProductId(id);
  }
}

// 2. 數字類型ID
export class OrderId extends UniqueId<number> {
  private static counter = 0;
  
  public static create(): OrderId {
    return new OrderId(++OrderId.counter);
  }
  
  public static fromNumber(id: number): OrderId {
    if (id <= 0) {
      throw new Error('訂單ID必須是正數');
    }
    return new OrderId(id);
  }
}

// 3. 複合類型ID
interface UserIdProps {
  tenant: string;
  localId: number;
}

export class UserId extends UniqueId<UserIdProps> {
  public static create(tenant: string, localId: number): UserId {
    return new UserId({ tenant, localId });
  }
  
  public get tenant(): string {
    return this.value.tenant;
  }
  
  public get localId(): number {
    return this.value.localId;
  }
  
  public toString(): string {
    return `${this.tenant}:${this.localId}`;
  }
}

// 4. 初始化和使用
// 在應用程序入口點初始化
UniqueId.initialize();

// 創建不同類型的ID
const productId = ProductId.create();
const orderId = OrderId.create();
const userId = UserId.create('tenant1', 123);

console.log(productId.toString()); // 輸出: 123e4567-e89b-12d3-a456-426614174000
console.log(orderId.toString());   // 輸出: 1
console.log(userId.toString());    // 輸出: tenant1:123

// 5. 使用自定義 UUID 生成器
import { v4 as uuidv4 } from 'uuid'; // 需要安裝 uuid 包
UniqueId.setGenerator(uuidv4);
```

## 最佳實踐

1. 所有領域實體應繼承 `Entity` 基類
2. 所有聚合根應繼承 `Entity` 並實現 `IAggregateRoot` 接口
3. 所有領域事件應繼承 `DomainEvent` 基類
4. 所有值對象應繼承 `ValueObject` 基類
5. 使用 `UniqueId<T>` 為實體創建特定類型的 ID，支持字符串、數字或複合類型
6. 使用實體的 `addDomainEvent` 方法添加領域事件
7. 使用 `getDomainEvents` 和 `clearDomainEvents` 管理領域事件
8. 在修改聚合根狀態時，應使用 `incrementVersion` 增加版本號
9. 值對象設計原則:
   - 不可變性 - 創建後不能修改
   - 相等性由屬性值決定，而非引用
   - 無副作用
   - 自包含

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

## 示例

在 `value-objects/examples` 目錄中提供了幾個示範如何使用 UniqueId 的示例：

### 數字類型 ID (NumericId)

```typescript
import { NumericId } from '../../../shared/domain/value-objects/examples/NumericId';

// 創建自增的數字 ID
const id1 = NumericId.create(); // 1
const id2 = NumericId.create(); // 2

// 從現有數字創建
const id3 = NumericId.fromNumber(42);

console.log(id1.value); // 1
console.log(id2.toString()); // "2"
console.log(id3.value); // 42
```

### 複合物件 ID (CompositeId)

```typescript
import { CompositeId } from '../../../shared/domain/value-objects/examples/CompositeId';

// 創建具有命名空間和版本的複合 ID
const id = CompositeId.create('user', 1);
console.log(id.toString()); // "user:1:1"

// 獲取複合 ID 的各個部分
console.log(id.namespace); // "user"
console.log(id.localId);   // 1
console.log(id.version);   // 1

// 創建新版本
const idV2 = id.incrementVersion();
console.log(idV2.toString()); // "user:1:2"

// 從字符串解析
const parsedId = CompositeId.fromString('product:42:3');
console.log(parsedId.namespace); // "product"
console.log(parsedId.localId);   // 42
console.log(parsedId.version);   // 3
```

這些示例展示了如何使用 UniqueId 的泛型能力來創建各種類型的 ID 值對象，從簡單的字符串和數字到複雜的複合對象。 