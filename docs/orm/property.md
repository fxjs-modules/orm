---
title: Property
---
# Property <Badge type="warning">WIP</Badge>

Property 是 ORM 中定义 model 的基础元素, 一个 Property 被认为是典型的数据库表中的一个字段在 model 上的**映射**.

## 声明 Property

在创建一个 model 时, 声明 Property 最必要的:

```js
var User = db.define('user', {
    name: String
});
```

我们声明了一个名为 `name` 的 Property, 其类型为 `String`, 它等价于这样的定义:

```js
var User = db.define('user', {
    name: {
        type: 'text'
    }
});
```

这两种声明**完全等价**, 第一种风格是基于 Function 的简写(参考[简写](#简写)); 但第二种风格是**完整声明**, 允许我们为 `name` 这个 Property 指定更多的特性和行为.

## Property 类型

ORM 目前支持内置的 property 类型有:

| 类型 | 意义 | 简写 | MySQL | SQLite | PostgreSQL |
| ---- | ---- | ---- | ---- | ---- | ---- |
| `text` | 文本 | `String` | `VARCHAR` | `TEXT` | `VARCHAR` |
| `integer` | 整数 | - | `INTEGER` | `INTEGER` | `INTEGER` |
| `number` | 数值类型 | `Number` | `INTEGER`<br />`DOUBLE` | `INTEGER`<br />`DOUBLE` | `INTEGER`<br />`DOUBLE` |
| `serial` | 自增整数 | - | `INTEGER`<br/> `SERIAL` | `INTEGER`<br/> `SERIAL` | `INTEGER`<br/> `SERIAL` |
| `boolean` | 布尔值 | `Boolean` | `BOOLEAN` | `BOOLEAN` | `BOOLEAN` |
| `date` | 日期 | `Date` | `DATE` | `DATE` | `DATE` |
| `binary` | 二进制 | `Buffer` | `BLOB` | `BLOB` | `BLOB` |
| `object` | 对象 | `Object` | `JSON` | `JSON` | `JSON` |
| `enum` | 枚举 | `Array<any>` | `ENUM` | `ENUM` | `ENUM` |

property 的 `type` 字段决定其基本类型, 其它字段则用于补充说明这个 property 的更多特性和行为. 一个完整的 property 定义可以包含以下字段:

| 字段名 | 类型 | 必需 | 意义 |
| ---- | ---- | ---- | ---- |
| `type` | `string` | required | property 的基本类型 |
| `key` | `boolean` | optional | 是否是**关键 Property**, 比如主键, 或是关联关系中的关联键. |
| `primary` | `boolean` | optional | 是否为 primary key. |
| `required` | `boolean` | optional | 是否是必需的. |
| `mapsTo` | `string` | optional | 映射到实际数据库表中的字段名 |
| `unique` | `boolean` | optional | 是否为 unique key. |
| `index` | `string` | optional | 是否需要索引. |
| `serial` | `boolean` | optional | 是否为自增整数. 该属性的值可能影响 `type` 的最终值 |
| `defaultValue` | `Value \| () => Value` | optional | 默认值, 或者返回默认值的函数 |
| ... | ... | ... | ... |

<!-- | 'point' | 点 | `POINT` | `POINT` | `POINT` | -->

除此以外, 根据 `type` 的不同, 还可能有其它的补充字段来表示 property 的更多特性和行为. 具体可参考下文中每个 type 的章节.

**注意** 同样的 `type`, 在不同的 database backend 中, 可能对应了不同的实际数据库定义, 如, 同样是 `{ type: 'text', size: 255 }`, 在 MySQL 中的定义是 `VARCHAR(255)`, 在 SQLite 和 PostgreSQL 中的定义则是 `TEXT`.

### 文本 `text`

**补充字段类型**

| 字段名 | 类型 | 意义 |
| ---- | ---- | ---- |
| `size` | `number` | 若映射的字段具有可变长度(如 mysql 中的 varchar), size 表示希望其拥有的长度 |
| `big` | `boolean` | 若数据库支持, 则 `big: true` 使用具有较大长度的字段类型, 如 mysql 中的 `LONGTEXT` |

### 整数 `integer`

**补充字段类型**

| 字段名 | 类型 | 意义 |
| ---- | ---- | ---- |
| `size` | `enum`: `2`, `4`, `8` | 2: `short`/`smallint`; 4: `integer`; 8: `long`/`bigint`. 若传入了其它值, 则修改为 4. |
| `unsigned` | `boolean` | 是否为无符号整数. |
| `serial` | `boolean` |  是否为自增整数, 若为 truthy, type 会被转化为 `serial` |

### 浮点数 `number`

**补充字段类型**

| 字段名 | 类型 | 意义 |
| ---- | ---- | ---- |
| `rational` | `boolean` | 是否为浮点数, 默认为 truthy, 若指定为 `false`, type 会被转化为 `integer` |


### 自增整数 `serial`

表示自增整数.

### 布尔值 `boolean`

表示布尔类型

### 日期 `date`

表示日期类型(具体到日)

| 字段名 | 类型 | 意义 |
| ---- | ---- | ---- |
| `time` | `boolean` | 是否包含当具体到微秒的时间信息 |

### 二进制 `binary` / `object`

表示二进制对象

| 字段名 | 类型 | 意义 |
| ---- | ---- | ---- |
| `big` | `boolean` | 若数据库支持, 则 `big: true` 使用具有较大长度的二进制数据, 如 mysql 中的 `LONGBLOB` |

### 枚举 `enum`

表示枚举值类型

### 简写

| 简写 | 等价配置 |
| ---- | ------- |
| `String` | `{ type: 'text' }` |
| `Number` | `{ type: 'number' }` |
| `Boolean` | `{ type: 'boolean' }` |
| `Date` | `{ type: 'date' }` |
| `Object` | `{ type: 'object' }` |
| `Buffer` | `{ type: 'binary' }` |



