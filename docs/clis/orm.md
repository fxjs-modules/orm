
# ORM CLI <Badge type="warning">WIP</Badge>

`orm-cli` 命令是用于帮助 orm 开发者进行测试开发的 CLI 工具.

## 前置要求

- fibjs >= 0.33.0

[FxJS ORM]:https://github.com/fxjs-modules/orm

## 快速开始

```bash
npm i -g @fxjs/orm-cli
```

使得 `orm` 命令在全局生效, 然后使用 `orm --help` 查看可用的命令:


```bash
# todo: add sample
```

所有的子命令文档也可以通过 `--help` 查看, 比如 `orm init-db --help` 不会真的执行命令, 而是打印出该命令的帮助信息:

```bash
# todo: add sample
```

## universal 命令

### upgrade

`orm upgrade`

检查并升级 orm cli 到最新版.


### dumpModel

 `orm dumpModel <modelDefine>.js`


`<modelDefine>.js` 被预期导出一个方法, 该方法被预期使用 ORM 连接某个数据库, 从数据库中读取信息, 包括表结构, 字段类型, 字段名称等等. 这些信息会被保存到 `<modelDefine>.js` 同目录下的 `<modelDefine>-dump.json` 文件中.

特别的, 对于数据库中每个表 table 的所有字段, 会根据 ORM 属性定义规范, 尝试建模, 得到一些属性定义, 记录为 `dataStoreProperties`,  同时用户定义的所有属性定位为 `userDefinedProperties`. 执行完 dumpModel 后, 会在 `<modelDefine>.js` 同目录下生成若干名为 `properties-for-t-<table>.patch` 的 patch, 表示每个表的 `dataStoreProperties` 和 `userDefinedProperties` 的差异.

一个参考的 `<modelDefine>.js` 文件如下:

```js
const modelConfig = {
    // "connection": "mysql://root@127.0.0.1/test",
    "connection": "sqlite:./tmp/dump-model.db",
}

/**
 * 
 * @param {import('@fxjs/orm/typings/ORM').ORMInstance} db
 * @param {import('@fxjs/orm')} ORM
 */
module.exports = (ORM) => {
    const db = ORM.connect(modelConfig.connection)

    db.define('user', {
        name: {
            type: 'text',
        },
        age: {
            type: 'integer',
            default: 18,
            size: 4
        }
    });

    // sync user definition to real database
    // db.sync();

    return {
        orm: db,
    };
};
```

假设该文件路径为 `/path_to/model-define.js`, 则会生成

- 一个 `/path_to/model-define-dump.json` 文件, 其中包含了该文件中定义的表结构信息.
- 一个 `/path_to/properties-for-t-user.patch` 文件, 其中包含了该文件中定义的表结构信息的差异.