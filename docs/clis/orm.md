
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

dumpModel 会打印数据库信息, 该过程中会把「用户定义的 model」和「从实际数据库抽象的 model」之间的 diff 也写入为 patch 文件.

`<modelDefine>.js` 被预期导出一个方法, 该方法中应使用 ORM 连接某个数据库, 并定义一些数据模型. 会根据 ORM 属性定义规范, dumpModel 过程中会对数据库中每个表 table 尝试建模, 得到一些属性定义 `dataStoreProperties`, 同时用户定义的所有属性记为 `userDefinedProperties`.

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

    return {
        orm: db,
    };
};
```

假设该文件路径为 `/path_to/model-define.js`, 则 dumpModel 会完成如下工作:

- 从数据库中读取信息, 包括表结构, 字段类型, 字段名称等等, 生成 `/path_to/model-define-dump.json` 文件, 包含表结构信息.
- 生成一个 `/path_to/properties-for-t-user.patch` 文件, 表示 `dataStoreProperties` 和 `userDefinedProperties` 的差异

在执行完 dumpModel 后 这些信息会被保存到 `<modelDefine>.js` 同目录下的 `<modelDefine>-dump.json` 文件中.


**选项**

- `--sync`: 是否将用户定义的 model 同步到数据库表结构中.