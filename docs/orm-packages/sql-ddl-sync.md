# `@fxjs/sql-ddl-sync`

[![NPM version](https://img.shields.io/npm/v/@fxjs/sql-ddl-sync.svg)](https://www.npmjs.org/package/@fxjs/sql-ddl-sync)&nbsp;
[![NPM download](https://img.shields.io/npm/dt/@fxjs/sql-ddl-sync.svg)](https://www.npmjs.org/package/@fxjs/sql-ddl-sync)&nbsp;
[![NPM download monthly](https://img.shields.io/npm/dm/@fxjs/sql-ddl-sync.svg)](https://www.npmjs.org/package/@fxjs/sql-ddl-sync)

[DDL]:https://en.wikipedia.org/wiki/Data_definition_language

<!-- SQL Transparent -->
<!-- One-Time Model, Multiple Backend -->

`sql-ddl-sync`, 意为 SQL [DDL] Synchronization, 即将 DDL 定义的数据模型同步到数据库.

- **数据库透明**: 在设计上, 对用户而言, sql-ddl-sync 提供了无关数据库类型 DDL 同步操作, 所有和 SQL 数据库交互的细节对用户而言都是透明的. 如此, 使用 sql-ddl-sync 的用户可以将精力放在数据模型设计上, 而不用关心数据库的类别.
- **一次建模, 多库适用**: 只需定义好数据类型, 就可以使用于不同的数据库: mysql, sqlite, postgresql 等

## 依赖

sql-ddl-sync 依赖 [db-driver](./db-driver.md) 和数据库进行交互, 你需要单独安装 `@fxjs/db-driver` 以使得 `@fxjs/sql-ddl-sync` 来连接数据库.

```sh
npm i -S @fxjs/db-driver @fxjs/sql-ddl-sync
```

## 快速开始

下面是使用 sql-ddl-sync 进行建模的示例, 设想我们有个 mysql 数据库 `mydb`, 里面不包含任何默认表以外的表

```js
const DBDriver   = require("@fxjs/db-driver");
const Sync  = require("@fxjs/sql-ddl-sync").Sync;

const dbdriver = DBDriver.create("mysql://username:password@localhost/mydb");

const sync = new Sync({
	dbdriver: dbdriver,
	debug   : function (text) {
		console.log("> %s", text);
	}
});

sync.defineCollection("ddl_sync_test", {
	id     : { type: "serial", key: true, serial: true },
	name   : { type: "text", required: true },
	age    : { type: "integer" },
	male   : { type: "boolean" },
	born   : { type: "date", time: true },
	born2  : { type: "date" },
	int2   : { type: "integer", size: 2 },
	int4   : { type: "integer", size: 4 },
	int8   : { type: "integer", size: 8 },
	float4 : { type: "number",  size: 4 },
	float8 : { type: "number",  size: 8 },
	photo  : { type: "binary" }
});

try {
	sync.sync()
	console.log("> Sync Done");
} catch (err) {
	if (err) {
		console.log("> Sync Error");
		console.log(err);
	}
}

// dbdriver would keep alive because we haven't close it, just force exit procss to end everyting.
process.exit(0);
```

在上述过程中, 我们做了这些事:

1. 我们创建了一个 `sync` 实例和一个连接到 mysql 数据库的 `dbdriver`
1. 通过 `sync` 声明了一个数据模型 `ddl_sync_test`, 它包含这些字段:
    - `id`: `serial` 类型, 并且是主键, 并且是自增长的.
    - `name`: `text` 类型, 并且是必须的.
    - `age`: `integer` 类型.
    - `male`: `boolean` 类型
    - ...
1. 调用 `sync.sync()`, 将 `ddl_sync_test` 的定义同步到数据库

做完这些事之后, 我们的 mysql 数据库中将出现一个新的表 `ddl_sync_test`.

## Sync

### `new Sync::Sync(opts: object)`

- `opts.dbdriver`: (required) [db-driver] 的实例.
- `opts.syncStrategy`: (optional) 同步策略, 参考[字段同步策略](#字段同步策略)
- `opts.suppressColumnDrop`: (optional) 若同步策略为 `hard` 时, 若数据库表中存在模型未定义的 column, 是否**阻止** sync 实例删除数据库表中的该 column.
    - 该配置对 sqlite 无效, 因为 sqlite 的表不支持删除 column.
- `opts.debug`: (optional) `debug` 函数, 类型为 `function debug(text: string): any`. 当提供时, 在 Sync 函数内部的一些关键操作会调用该函数, 开发者可通过该函数来帮助调试.

### `Sync::collections` <Badge type="warning">readonly</Badge>

sync 实例中已经定义的 collections.

### `Sync::dbdriver` <Badge type="warning">readonly</Badge>

sync 实例使用的 dbdriver.

### `Sync::Dialect` <Badge type="warning">readonly</Badge>

sync 实例使用的 Dialect, 取决于 dbdriver 的驱动类型. 如 dbdriver 连接到 mysql, 则 Dialect 也适配与 mysql

### `Sync::types` <Badge type="warning">readonly</Badge>

sync 实例中的自定义 types.

### `Sync::defineCollection(collection_name: string, properties: object)`

定义一个新的 collection.
<!-- TODO: 添加关于 properties 的说明 -->

### `Sync::findCollection(collection: string)`

查询 sync 实例中是名为 `collection` 的定义

### `Sync::defineType(type: string, proto: object)`

为 sync 增加自定义的 property 类型

### `Sync::createCollection(collection_def: object)`

根据 collection_def, 如果其指定的表在数据库中不存在, 在数据库中创建一个新的表, 并同步所有的 columns 定义到其中.

### `Sync::syncCollection(collection_name: string, opts: object)`

根据 `collection_name`, 同步数据库中的表与 sync 实例中的定义一致.

- `opts.columns`: (optional) 要同步的列, 若没有指定, 则同步数据库中的所有列.
- `opts.strategy`: (optional) 默认为 `'soft'`, 参考[字段同步策略](#字段同步策略)

### `Sync::syncIndexes(collection: string, indexes: object[])`

同步 indexes 索引信息到 `collection` 表中.

### `Sync::sync()` <Badge type="info">blocking</Badge>

同步 sync 实例中已经定义的所有 collection 到数据库中, 每个表在同步的时候都采取的同步策略取决于 `sync.strategy`, 参考[字段同步策略](#字段同步策略).

### `Sync::sync(cb: Function)` <Badge type="info">non-blocking</Badge>

和 `Sync::sync()` 一样, 但是是非阻塞版本.

### `Sync::forceSync()` <Badge type="info">blocking</Badge>

同步 sync 实例中已经定义的所有 collection 到数据库中, 每个表在同步的时候都采取的同步策略均为 `'hard'`, 参考[字段同步策略](#字段同步策略).

### `Sync::forceSync(cb: Function)` <Badge type="info">non-blocking</Badge>

和 `Sync::forceSync()` 一样, 但是是非阻塞版本.

### `Sync::needDefinitionToColumn(property: object, column: object, options?: object)`

比较一个用户提供的 property 与来自数据库表中的描述, 判定是否需要将 property 的描述同步到数据库表中.
<!-- TODO: 添加关于 property/column 的说明 -->

## 问题

### 字段同步策略

对业务建模, 并将其映射到 SQL 数据库表是很常见的需求, 上一节的例子为我们展示了 sql-ddl-sync 如何将一个数据模型同步到数据库 --- 不过, 有一点可能会被忽略, 在上述例子中, 数据库里没有 `ddl_sync_test` 这张表.

我们设想一下, 如果这张表已经存在 mysql 数据库中, 并且, 我们的建模和表实际上的结构不符, 比如

- `ddl_sync_test` 表中并没有 `photo` 字段
- `born` 字段的类型是 `LONG` 而不是 `Date`, 因为建表时, 决定用 Unix 时间戳来表示日期, 而不想用 mysql 的 date 类型.
- ...

这时候如果我们建模并且执行 `sync.sync()`, 会发生什么?

sync 实例在被创建时, 支持传入一个 `strategy` 参数.

```js
var sync = new sql.sync({
    strategy: 'soft', // 'soft' | 'hard' | 'mixed'
});
```

该参数指定, 当对一个已经存在的表进行 `sync.sync()` 时, 应该采取何种策略:

- `soft`: (**默认策略**) 如果表已经存在, 则不做任何操作.
- `hard`: 即便表已经存在, 则使用模型的定义, 逐个 column 将表中的结构改变.
    - 如果模型中定义了某个 column, 但表中不存在的, 则会增加
    - 如果模型中定义的某个 column 和表中现存的 column 有冲突, 则尝试强行改写结构
    - 如果表中存在某个模型中未定义的 column, 根据 sync.suppressColumnDrop 来决定是否要删除该 column
    - 注意: 根据连接的数据库, 连接用户权限的不同, 该操作可能失败.
- `mixed`: 如果表已经存在, 则使用模型的定义, 尝试将缺少的 column 进行补齐.
    - 注意: 根据连接的数据库, 连接用户权限的不同, 该操作可能失败.

**注意** 在实际业务中, 修改数据库结构是一件很**严肃**的事情, 必须严格遵照数据库的结构规范, 并且由专业的工程师来执行. 因此,, 我们不建议使用 `hard` 策略, 它**很可能**会导致数据库的数据丢失. 更推荐的做法是, **永远使用 soft 策略**, 如果模型不符合实际的数据库表, 应根据业务变更, 修改数据库表结构或修改建模的定义, 以使得 sync 符合实际的需求.

<!-- 我们可依然以使用 `sync.forceSync()` 来更新表结构, 但是这样可能会导致数据库中的数据丢失. -->